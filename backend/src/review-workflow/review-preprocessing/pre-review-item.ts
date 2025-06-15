import { makePrismaReviewJobRepository } from "../../api/features/review/domain/repository";
import { makePrismaUserPreferenceRepository } from "../../api/features/user-preference/domain/repository";
import { REVIEW_FILE_TYPE } from "../../api/features/review/domain/model/review";
import { makePrismaCheckRepository } from "../../api/features/checklist/domain/repository";
import { getLanguageName, DEFAULT_LANGUAGE } from "../../utils/language";
declare const console: {
  log: (...data: any[]) => void;
  error: (...data: any[]) => void;
};

/**
 * Review item pre-processing parameters
 */
export interface PreReviewItemParams {
  reviewJobId: string;
  checkId: string;
  reviewResultId: string;
  userId?: string; // Optional user ID for language preference
}

/**
 * MCP サーバー設定情報
 */
interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * Pre-process a review item
 * Gathers all necessary data before sending to the Python MCP Lambda
 * @param params Processing parameters
 * @returns Data needed for MCP processing
 */
export async function preReviewItemProcessor(
  params: PreReviewItemParams
): Promise<any> {
  const { reviewJobId, checkId, reviewResultId, userId } = params;

  // Get user preference for language if userId is provided
  let userLanguage = DEFAULT_LANGUAGE;
  // MCPサーバーの設定 (指定がない場合は空文字列で何も使わない)
  let mcpServerName = "";

  if (userId) {
    try {
      console.log(`[DEBUG PRE] Getting user preferences for user ${userId}`);
      const userPreferenceRepository =
        await makePrismaUserPreferenceRepository();
      const userPreference =
        await userPreferenceRepository.getUserPreference(userId);

      if (userPreference && userPreference.language) {
        userLanguage = userPreference.language;
        console.log(
          `[DEBUG PRE] Using language from preference: ${userLanguage}`
        );
      }
    } catch (error) {
      console.error(`[DEBUG PRE] Failed to fetch user preferences:`, error);
      // Continue with default language
    }
  }

  // ジョブからMCPサーバー名を取得
  const reviewJobRepository = await makePrismaReviewJobRepository();
  const jobDetail = await reviewJobRepository.findReviewJobById({
    reviewJobId,
  });

  // ジョブ詳細の全内容をログ出力（デバッグ用）
  console.log(`[DEBUG PRE] Job detail dump: ${JSON.stringify(jobDetail)}`);

  if (jobDetail.mcpServerName) {
    mcpServerName = jobDetail.mcpServerName;
    console.log(`[DEBUG PRE] Using MCP server: ${mcpServerName}`);
    console.log(`[DEBUG PRE] Job's mcpServerName value: "${mcpServerName}"`);
  } else {
    console.log(
      `[DEBUG PRE] No mcpServerName found in jobDetail. Available fields: ${Object.keys(jobDetail).join(", ")}`
    );
  }

  // Get check list item details
  const checkRepository = await makePrismaCheckRepository();
  const checkList = await checkRepository.findCheckListItemById(checkId);

  if (!checkList) {
    throw new Error(`Check list item not found: ${checkId}`);
  }

  // 既に取得済みのためfindReviewJobByIdを再度呼び出さない

  if (!jobDetail.documents || jobDetail.documents.length === 0) {
    throw new Error(`No documents found for review job ${reviewJobId}`);
  }

  // Get documents for processing - both PDF and images are now supported
  // Filter for both PDF and image types
  const pdfDocuments = jobDetail.documents.filter(
    (doc) => doc.fileType === REVIEW_FILE_TYPE.PDF
  );

  const imageDocuments = jobDetail.documents.filter(
    (doc) => doc.fileType === REVIEW_FILE_TYPE.IMAGE
  );

  // Combine documents for processing
  const documentsToProcess = [...pdfDocuments, ...imageDocuments];

  if (documentsToProcess.length === 0) {
    throw new Error(
      `No PDF or image documents found for review job ${reviewJobId}`
    );
  }

  console.log(
    `[DEBUG PRE] Prepared review item data for ${reviewResultId}, found ${pdfDocuments.length} PDF documents and ${imageDocuments.length} image documents`
  );

  // Return data needed by the Python MCP Lambda
  // Note: fileTypes field removed as agent.py detects file types directly from file extensions
  const result = {
    checkName: checkList.name,
    checkDescription: checkList.description || "",
    languageName: getLanguageName(userLanguage),
    documentPaths: documentsToProcess.map((doc) => doc.s3Path),
    documentIds: documentsToProcess.map((doc) => doc.id),
  };

  // MCPサーバー名が設定されている場合、その設定を取得
  const mcpServers: McpServerConfig[] = [];

  if (mcpServerName && userId) {
    try {
      const userPreferenceRepository =
        await makePrismaUserPreferenceRepository();

      // 指定されたMCPサーバー名がカンマ区切りの場合、複数のサーバーと見なす
      const serverNames = mcpServerName.split(",").map((name) => name.trim());
      console.log(
        `[DEBUG PRE] Split serverNames: ${JSON.stringify(serverNames)}`
      );

      for (const name of serverNames) {
        console.log(`[DEBUG PRE] Fetching config for server: "${name}"`);
        const config = await userPreferenceRepository.getMcpServerConfigByName(
          userId,
          name
        );
        console.log(
          `[DEBUG PRE] Config result for ${name}: ${config ? "Found" : "Not found"}`
        );
        if (config) {
          console.log(`[DEBUG PRE] Found MCP config for server: ${name}`);
          console.log(`[DEBUG PRE] Config details: ${JSON.stringify(config)}`);
          mcpServers.push(config);
        }
      }
      console.log(
        `[DEBUG PRE] Final mcpServers array length: ${mcpServers.length}`
      );
    } catch (error) {
      console.error(`[DEBUG PRE] Failed to fetch MCP server config:`, error);
    }
  }

  const finalResult = {
    ...result,
    // Always include mcpServers array, even if empty - required by Step Functions
    mcpServers: mcpServers.length > 0 ? mcpServers : [],
  };
  console.log(`[DEBUG PRE] Final return value: ${JSON.stringify(finalResult)}`);
  return finalResult;
}
