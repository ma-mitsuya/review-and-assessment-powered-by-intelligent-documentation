import { describe, it, expect, vi, beforeEach } from 'vitest';
import { combinePageResults } from '../combine-results';
import { S3Utils } from '../../../core/utils';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { modelId } from '../../../core/bedrock/model-id';

// モックの設定
vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: vi.fn().mockImplementation(() => ({
      send: vi.fn()
    })),
    ConverseCommand: vi.fn()
  };
});

describe('combinePageResults', () => {
  let mockS3: S3Utils;
  let mockBedrock: BedrockRuntimeClient;
  const mockModelId: modelId = 'anthropic.claude-3-sonnet-20240229-v1:0';
  const mockInferenceConfig = {
    maxTokens: 4096,
    temperature: 0.5,
    topP: 0.9
  };

  beforeEach(() => {
    // S3モックの設定
    mockS3 = {
      getObject: vi.fn().mockImplementation((key: string) => {
        // 常に成功するように修正
        return Promise.resolve({ 
          ok: true, 
          value: Buffer.from(key.includes('extracted-text') ? '抽出されたテキスト' : 'LLMによるOCRテキスト') 
        });
      }),
      uploadObject: vi.fn().mockImplementation(() => {
        return Promise.resolve({ ok: true });
      })
    } as unknown as S3Utils;

    // Bedrockモックの設定
    mockBedrock = {
      send: vi.fn().mockImplementation(() => {
        return Promise.resolve({
          output: {
            message: {
              content: [
                {
                  text: JSON.stringify([
                    {
                      "name": "建築物と敷地の関係の適切性確認",
                      "description": "建築物と敷地の関係が適切かどうか確認する",
                      "parent_id": null,
                      "item_type": "SIMPLE",
                      "is_conclusion": false,
                      "flow_data": null
                    },
                    {
                      "name": "用途上の可分・不可分",
                      "description": "敷地に複数の建築物を建築する場合（既存建築物を含む）、相互の建築物が機能上関連しているか",
                      "parent_id": 1,
                      "item_type": "SIMPLE",
                      "is_conclusion": false,
                      "flow_data": null
                    }
                  ])
                }
              ]
            }
          }
        });
      })
    } as unknown as BedrockRuntimeClient;
  });

  it('正常系: S3からデータを取得し、LLMで処理して結果を保存できること', async () => {
    const result = await combinePageResults(
      { documentId: 'test-doc', pageNumber: 1 },
      { s3: mockS3, bedrock: mockBedrock, modelId: mockModelId, inferenceConfig: mockInferenceConfig }
    );

    // 結果が成功していることを確認
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ documentId: 'test-doc', pageNumber: 1 });
    }

    // S3からのデータ取得が呼ばれたことを確認
    expect(mockS3.getObject).toHaveBeenCalledTimes(2);
    
    // Bedrockが呼ばれたことを確認
    expect(mockBedrock.send).toHaveBeenCalledTimes(1);
    
    // S3へのアップロードが呼ばれたことを確認
    expect(mockS3.uploadObject).toHaveBeenCalledTimes(1);
  });

  it('異常系: S3からのデータ取得に失敗した場合はエラーを返すこと', async () => {
    // S3のgetObjectをオーバーライドして失敗するようにする
    mockS3.getObject = vi.fn().mockImplementation(() => {
      return Promise.resolve({ ok: false, error: new Error('S3からの読み込みに失敗しました') });
    });

    const result = await combinePageResults(
      { documentId: 'test-doc', pageNumber: 1 },
      { s3: mockS3, bedrock: mockBedrock, modelId: mockModelId, inferenceConfig: mockInferenceConfig }
    );

    // 結果がエラーであることを確認
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('S3からの読み込み失敗');
    }
  });

  it('異常系: LLMの出力が配列でない場合はエラーを返すこと', async () => {
    // Bedrockの応答をオブジェクト形式に変更
    mockBedrock.send = vi.fn().mockImplementation(() => {
      return Promise.resolve({
        output: {
          message: {
            content: [
              {
                text: JSON.stringify({
                  "name": "建築物と敷地の関係の適切性確認",
                  "description": "建築物と敷地の関係が適切かどうか確認する",
                  "parent_id": null,
                  "item_type": "SIMPLE",
                  "is_conclusion": false,
                  "flow_data": null
                })
              }
            ]
          }
        }
      });
    });

    const result = await combinePageResults(
      { documentId: 'test-doc', pageNumber: 1 },
      { s3: mockS3, bedrock: mockBedrock, modelId: mockModelId, inferenceConfig: mockInferenceConfig }
    );

    // 結果がエラーであることを確認
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('JSON解析エラー');
    }
  });

  it('正常系: フローチャート型項目のIDも正しく変換されること', async () => {
    // フローチャート型項目を含むLLM応答を設定
    mockBedrock.send = vi.fn().mockImplementation(() => {
      return Promise.resolve({
        output: {
          message: {
            content: [
              {
                text: JSON.stringify([
                  {
                    "name": "建築物と敷地の関係の適切性確認",
                    "description": "建築物と敷地の関係が適切かどうか確認する",
                    "parent_id": null,
                    "item_type": "SIMPLE",
                    "is_conclusion": false,
                    "flow_data": null
                  },
                  {
                    "name": "特定された資産があるか",
                    "description": "特定された資産があるかどうか確認する",
                    "parent_id": 1,
                    "item_type": "FLOW",
                    "is_conclusion": false,
                    "flow_data": {
                      "condition_type": "YES_NO",
                      "next_if_yes": 3,
                      "next_if_no": 4
                    }
                  },
                  {
                    "name": "複数選択肢の項目",
                    "description": "複数の選択肢から選ぶ項目",
                    "parent_id": 1,
                    "item_type": "FLOW",
                    "is_conclusion": false,
                    "flow_data": {
                      "condition_type": "MULTI_CHOICE",
                      "next_options": {
                        "選択肢1": 3,
                        "選択肢2": 4
                      }
                    }
                  }
                ])
              }
            ]
          }
        }
      });
    });

    // S3のuploadObjectをスパイに変更して引数をキャプチャ
    let capturedJson: string | null = null;
    mockS3.uploadObject = vi.fn().mockImplementation((key: string, data: Buffer) => {
      capturedJson = data.toString('utf-8');
      return Promise.resolve({ ok: true });
    });

    const result = await combinePageResults(
      { documentId: 'test-doc', pageNumber: 1 },
      { s3: mockS3, bedrock: mockBedrock, modelId: mockModelId, inferenceConfig: mockInferenceConfig }
    );

    // 結果が成功していることを確認
    expect(result.ok).toBe(true);

    // キャプチャしたJSONをパース
    const parsedJson = JSON.parse(capturedJson!);
    
    // テスト前にJSONを出力して確認
    console.log('Captured JSON:', capturedJson);
    
    // parent_idがstring型に変換されていることを確認
    expect(typeof parsedJson.checklist_items[1].parent_id).toBe('string');
    
    // 変換されたJSONの構造を確認
    expect(parsedJson.checklist_items.length).toBe(3);
    expect(parsedJson.meta_data.document_id).toBe('test-doc');
    expect(parsedJson.meta_data.page_number).toBe(1);
    
    // 変換されたIDが数値でないことを確認（ULIDは数値に変換するとNaNになる）
    const nextIfYes = parsedJson.checklist_items[1].flow_data.next_if_yes;
    expect(nextIfYes).toBeDefined();
    expect(typeof nextIfYes).toBe('string');
    expect(nextIfYes.length).toBeGreaterThan(10); // ULIDは26文字
    
    // next_optionsの値も確認
    const nextOptions = parsedJson.checklist_items[2].flow_data.next_options;
    expect(nextOptions).toBeDefined();
    expect(typeof Object.values(nextOptions)[0]).toBe('string');
  });
});
