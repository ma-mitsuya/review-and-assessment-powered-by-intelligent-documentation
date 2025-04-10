import "source-map-support/register";
import { PrismaClient } from "@prisma/client";
import { ulid } from "ulid";

/**
 * データベース初期化ハンドラー
 * - データベーススキーマの作成
 * - 初期データの投入
 */
export const handler = async (event: any): Promise<any> => {
  console.log("DB初期化ハンドラー:", JSON.stringify(event, null, 2));

  try {
    const prisma = new PrismaClient();
    
    // アクションタイプに基づいて処理を分岐
    switch (event.action) {
      case "initializeSchema":
        return await initializeSchema(prisma);
      case "seedData":
        return await seedData(prisma);
      default:
        throw new Error(`未知のアクション: ${event.action}`);
    }
  } catch (error) {
    console.error("DB初期化エラー:", error);
    throw error;
  }
};

/**
 * データベーススキーマの初期化
 * Prisma db pushを使用してスキーマを同期
 */
async function initializeSchema(prisma: PrismaClient): Promise<{ success: boolean; message: string }> {
  try {
    // Prismaクライアントを使用してスキーマが存在するか確認
    await prisma.$queryRaw`SELECT 1 FROM check_list_sets LIMIT 1`;
    return {
      success: true,
      message: "スキーマは既に存在します"
    };
  } catch (error) {
    console.log("スキーマが存在しないため、作成します");
    
    try {
      // 必要なテーブルを直接作成するSQLを実行します
      
      // チェックリストセットテーブルの作成
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS check_list_sets (
          check_list_set_id VARCHAR(26) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT
        )
      `;
      
      // チェックリストテーブルの作成
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS check_list (
          check_id VARCHAR(26) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          parent_id VARCHAR(26),
          check_list_set_id VARCHAR(26),
          item_type VARCHAR(20) NOT NULL,
          is_conclusion BOOLEAN DEFAULT FALSE,
          flow_data JSON,
          meta_data JSON,
          FOREIGN KEY (parent_id) REFERENCES check_list(check_id),
          FOREIGN KEY (check_list_set_id) REFERENCES check_list_sets(check_list_set_id)
        )
      `;
      
      // ドキュメントテーブルの作成
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS documents (
          document_id VARCHAR(26) PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          s3_path VARCHAR(512) NOT NULL,
          file_type VARCHAR(50) NOT NULL,
          upload_date TIMESTAMP NOT NULL,
          check_list_set_id VARCHAR(26),
          user_id VARCHAR(50),
          FOREIGN KEY (check_list_set_id) REFERENCES check_list_sets(check_list_set_id)
        )
      `;
      
      // 抽出項目テーブルの作成
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS extracted_items (
          item_id VARCHAR(26) PRIMARY KEY,
          check_id VARCHAR(26) NOT NULL,
          original_value TEXT,
          modified_value TEXT,
          field_name VARCHAR(255),
          is_modified BOOLEAN DEFAULT FALSE,
          modified_date TIMESTAMP,
          user_id VARCHAR(50),
          FOREIGN KEY (check_id) REFERENCES check_list(check_id)
        )
      `;
      
      // チェック結果テーブルの作成
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS check_results (
          result_id VARCHAR(26) PRIMARY KEY,
          check_id VARCHAR(26) NOT NULL,
          document_id VARCHAR(26) NOT NULL,
          result_value VARCHAR(20),
          confidence_score FLOAT,
          extracted_text TEXT,
          llm_explanation TEXT,
          user_override BOOLEAN DEFAULT FALSE,
          timestamp TIMESTAMP NOT NULL,
          FOREIGN KEY (check_id) REFERENCES check_list(check_id),
          FOREIGN KEY (document_id) REFERENCES documents(document_id)
        )
      `;
      
      return {
        success: true,
        message: "スキーマを作成しました"
      };
    } catch (sqlError) {
      console.error("SQL実行エラー:", sqlError);
      throw sqlError;
    }
  }
}

/**
 * 初期データの投入
 */
async function seedData(prisma: PrismaClient): Promise<{ success: boolean; message: string }> {
  try {
    // 既存のデータがあるか確認
    const existingSetCount = await prisma.checkListSet.count();
    if (existingSetCount > 0) {
      return {
        success: true,
        message: "初期データは既に存在します"
      };
    }

    // チェックリストセットの作成
    const checkListSetId = ulid();
    await prisma.checkListSet.create({
      data: {
        id: checkListSetId,
        name: "基本契約書チェックリスト",
        description: "契約書の基本的な項目をチェックするためのセット"
      }
    });

    // 親チェックリスト項目の作成
    const parentCheckId = ulid();
    await prisma.checkList.create({
      data: {
        id: parentCheckId,
        name: "基本契約情報の確認",
        description: "契約書の基本的な情報が正しく記載されているかの確認",
        itemType: "SIMPLE",
        isConclusion: false,
        checkListSetId: checkListSetId
      }
    });

    // 子チェックリスト項目の作成
    await prisma.checkList.create({
      data: {
        id: ulid(),
        name: "契約当事者の記載",
        description: "契約書に両当事者の正式名称が正確に記載されているか",
        parentId: parentCheckId,
        itemType: "SIMPLE",
        isConclusion: false,
        checkListSetId: checkListSetId
      }
    });

    await prisma.checkList.create({
      data: {
        id: ulid(),
        name: "契約日の記載",
        description: "契約締結日が明記され、両当事者の合意日と一致しているか",
        parentId: parentCheckId,
        itemType: "SIMPLE",
        isConclusion: false,
        checkListSetId: checkListSetId
      }
    });

    // フローチャート型チェックリスト項目の作成
    const flowStartId = ulid();
    await prisma.checkList.create({
      data: {
        id: flowStartId,
        name: "リース契約判定",
        description: "この契約書がリース契約に該当するかの判断フロー",
        itemType: "FLOW",
        isConclusion: false,
        checkListSetId: checkListSetId,
        flowData: {
          next_if_yes: "yes_branch",
          next_if_no: "no_branch",
          condition_type: "YES_NO"
        }
      }
    });

    return {
      success: true,
      message: "初期データを投入しました"
    };
  } catch (error) {
    console.error("初期データ投入エラー:", error);
    return {
      success: false,
      message: `初期データ投入に失敗しました: ${error}`
    };
  } finally {
    await prisma.$disconnect();
  }
}
