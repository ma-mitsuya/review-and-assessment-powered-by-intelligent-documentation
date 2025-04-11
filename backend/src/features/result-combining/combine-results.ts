import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message,
} from "@aws-sdk/client-bedrock-runtime";
import { err, ok, Result, S3Utils } from "../../core/utils";
import {
  getPageCombinedKey,
  getPageExtractedTextKey,
  getPageLlmOcrTextKey,
} from "../common/storage-paths";
import { ChecklistItem, ChecklistResponse, CombinedPageResult } from "./types";
import { CHECKLIST_EXTRACTION_PROMPT } from "./prompt";
import { modelId } from "../../core/bedrock/model-id";
import { ulid } from "ulid";

/**
 * 数値のparent_idをulidに変換する関数
 * @param items チェックリスト項目の配列
 * @returns parent_idがulidに変換されたチェックリスト項目の配列
 */
function convertParentIdsToUlid(items: ChecklistItem[]): ChecklistItem[] {
  // 数値IDとulidのマッピングを作成
  const idMapping: Record<number, string> = {};
  
  // 最初にすべての項目にulidを割り当てる
  items.forEach((item, index) => {
    idMapping[index + 1] = ulid();
  });
  
  // parent_idを変換した新しい配列を作成
  return items.map((item) => {
    const newItem = { ...item };
    
    // parent_idがnullでない場合、対応するulidに変換
    if (newItem.parent_id !== null) {
      const parentIdNumber = Number(newItem.parent_id);
      if (!isNaN(parentIdNumber) && idMapping[parentIdNumber]) {
        newItem.parent_id = idMapping[parentIdNumber];
      }
    }
    
    // flow_dataのnext_if_yes, next_if_no, next_optionsの値も変換
    if (newItem.flow_data) {
      if (newItem.flow_data.condition_type === "YES_NO") {
        if (newItem.flow_data.next_if_yes !== undefined) {
          const nextIfYesNum = Number(newItem.flow_data.next_if_yes);
          if (!isNaN(nextIfYesNum) && idMapping[nextIfYesNum]) {
            newItem.flow_data.next_if_yes = idMapping[nextIfYesNum];
          }
        }
        if (newItem.flow_data.next_if_no !== undefined) {
          const nextIfNoNum = Number(newItem.flow_data.next_if_no);
          if (!isNaN(nextIfNoNum) && idMapping[nextIfNoNum]) {
            newItem.flow_data.next_if_no = idMapping[nextIfNoNum];
          }
        }
      } else if (newItem.flow_data.condition_type === "MULTI_CHOICE" && newItem.flow_data.next_options) {
        const newOptions: Record<string, string> = {};
        for (const [key, value] of Object.entries(newItem.flow_data.next_options)) {
          const valueNum = Number(value);
          if (!isNaN(valueNum) && idMapping[valueNum]) {
            newOptions[key] = idMapping[valueNum];
          }
        }
        newItem.flow_data.next_options = newOptions;
      }
    }
    
    return newItem;
  });
}

export async function combinePageResults(
  params: {
    documentId: string;
    pageNumber: number;
  },
  deps: {
    s3: S3Utils;
    bedrock: BedrockRuntimeClient;
    modelId: modelId;
    inferenceConfig: {
      maxTokens: number;
      temperature: number;
      topP: number;
    };
  }
): Promise<Result<CombinedPageResult, Error>> {
  const { documentId, pageNumber } = params;
  const { s3, bedrock, modelId, inferenceConfig } = deps;

  console.log(
    `[combinePageResults] 開始: documentId=${documentId}, pageNumber=${pageNumber}, modelId=${modelId}`
  );

  // S3からデータ取得
  const textKey = getPageExtractedTextKey(documentId, pageNumber);
  const llmKey = getPageLlmOcrTextKey(documentId, pageNumber);

  console.log(
    `[combinePageResults] S3からデータ取得開始: textKey=${textKey}, llmKey=${llmKey}`
  );

  const [textRes, llmRes] = await Promise.all([
    s3.getObject(textKey),
    s3.getObject(llmKey),
  ]);

  if (!textRes.ok || !llmRes.ok) {
    const errorKey = !textRes.ok ? textKey : llmKey;
    const errorMessage = !textRes.ok
      ? (textRes as any).error.message
      : (llmRes as any).error.message;
    console.error(
      `[combinePageResults] S3からの読み込み失敗: ${errorKey} - ${errorMessage}`
    );
    return err(
      new Error(
        `S3からの読み込み失敗: ${
          !textRes.ok ? `textKey (${textKey})` : `llmKey (${llmKey})`
        }`
      )
    );
  }

  console.log(`[combinePageResults] S3からデータ取得成功`);
  const text = textRes.value.toString("utf-8");
  const llm = llmRes.value.toString("utf-8");

  console.log(
    `[combinePageResults] 抽出テキスト: ${text.length}文字, LLM結果: ${llm.length}文字`
  );

  // Bedrockを使用してチェックリストを抽出
  console.log(`[combinePageResults] Bedrockによるチェックリスト抽出開始`);
  
  try {
    // 入力メッセージの作成
    const messages: Message[] = [
      {
        role: "user",
        content: [
          {
            text: `${CHECKLIST_EXTRACTION_PROMPT}\n\n以下の文書からチェックリストを抽出してください：\n\n${text}\n\n${llm}`,
          },
        ],
      },
    ];

    // Bedrockへのリクエスト作成
    const command = new ConverseCommand({
      modelId: modelId,
      messages,
      inferenceConfig: {
        maxTokens: inferenceConfig.maxTokens,
        temperature: inferenceConfig.temperature,
        topP: inferenceConfig.topP,
      },
    });

    // Bedrockへのリクエスト実行
    const response = await bedrock.send(command);
    
    if (!response.output?.message?.content?.[0]?.text) {
      console.error(`[combinePageResults] Bedrockからの応答が不正です`);
      return err(new Error("Bedrockからの応答が不正です"));
    }

    // LLMの出力からJSONを抽出
    const llmOutput = response.output.message.content[0].text;
    console.log(`[combinePageResults] Bedrock応答取得: ${llmOutput.length}文字`);
    
    try {
      // LLMの出力をパース（必ず配列として扱う）
      const checklistItems: ChecklistItem[] = JSON.parse(llmOutput);
      
      // 配列でない場合はエラー
      if (!Array.isArray(checklistItems)) {
        throw new Error("LLMの出力が配列形式ではありません");
      }
      
      // parent_idを数値からulidに変換
      const convertedItems = convertParentIdsToUlid(checklistItems);
      
      // メタデータを追加
      const responseData: ChecklistResponse = {
        checklist_items: convertedItems,
        meta_data: {
          document_id: documentId,
          page_number: pageNumber
        }
      };
      
      // 最終的なJSONを作成
      const finalJson = JSON.stringify(responseData, null, 2);

      // S3に書き込む
      const combinedKey = getPageCombinedKey(documentId, pageNumber);
      console.log(`[combinePageResults] 結果をS3に保存開始: ${combinedKey}`);
      const result = await s3.uploadObject(combinedKey, Buffer.from(finalJson));
      if (!result.ok) {
        console.error(
          `[combinePageResults] S3への書き込み失敗: ${result.error.message}`
        );
        return err(new Error("S3への書き込み失敗"));
      }
      console.log(`[combinePageResults] S3への書き込み成功`);

      console.log(
        `[combinePageResults] 処理完了: documentId=${documentId}, pageNumber=${pageNumber}`
      );
      return ok({ documentId, pageNumber });
    } catch (parseError) {
      console.error(`[combinePageResults] JSON解析エラー: ${(parseError as Error).message}`);
      console.error(`[combinePageResults] 受信したJSON: ${llmOutput}`);
      return err(new Error(`JSON解析エラー: ${(parseError as Error).message}`));
    }
  } catch (error) {
    console.error(`[combinePageResults] エラー発生: ${(error as Error).message}`);
    return err(error as Error);
  }
}
