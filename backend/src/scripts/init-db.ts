/**
 * データベース初期化スクリプト
 * 
 * このスクリプトは、db-init-handler.tsの機能をローカル環境で実行するためのものです。
 * Lambda環境ではなくローカル開発環境で実行することを想定しています。
 */

import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

async function main(): Promise<void> {
  console.log('データベース初期化を開始します...');
  
  const prisma = new PrismaClient();
  
  try {
    // スキーマの初期化
    await initializeSchema(prisma);
    
    // 初期データの投入
    await seedData(prisma);
    
    console.log('データベース初期化が完了しました');
  } catch (error) {
    console.error('データベース初期化中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * データベーススキーマの初期化
 */
async function initializeSchema(prisma: PrismaClient): Promise<void> {
  try {
    // Prismaクライアントを使用してスキーマが存在するか確認
    await prisma.$queryRaw`SELECT 1 FROM check_list_sets LIMIT 1`;
    console.log('スキーマは既に存在します');
  } catch (error) {
    console.log('スキーマが存在しないため、作成します');
    
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
      
      console.log('スキーマを作成しました');
    } catch (sqlError) {
      console.error('スキーマ作成エラー:', sqlError);
      throw sqlError;
    }
  }
}

/**
 * 初期データの投入
 */
async function seedData(prisma: PrismaClient): Promise<void> {
  try {
    // 既存のデータがあるか確認
    const existingSetCount = await prisma.checkListSet.count();
    if (existingSetCount > 0) {
      console.log('初期データは既に存在します');
      return;
    }

    console.log('初期データを投入します...');

    // チェックリストセットの作成
    const checkListSetId = ulid();
    const checkListSet = await prisma.checkListSet.create({
      data: {
        id: checkListSetId,
        name: '基本契約書チェックリスト',
        description: '契約書の基本的な項目をチェックするためのセット'
      }
    });
    console.log(`チェックリストセットを作成しました: ${checkListSet.name}`);

    // 親チェックリスト項目の作成
    const parentCheckId = ulid();
    const parentCheck = await prisma.checkList.create({
      data: {
        id: parentCheckId,
        name: '基本契約情報の確認',
        description: '契約書の基本的な情報が正しく記載されているかの確認',
        itemType: 'SIMPLE',
        isConclusion: false,
        checkListSetId: checkListSetId
      }
    });
    console.log(`親チェックリスト項目を作成しました: ${parentCheck.name}`);

    // 子チェックリスト項目の作成
    const childCheck1 = await prisma.checkList.create({
      data: {
        id: ulid(),
        name: '契約当事者の記載',
        description: '契約書に両当事者の正式名称が正確に記載されているか',
        parentId: parentCheckId,
        itemType: 'SIMPLE',
        isConclusion: false,
        checkListSetId: checkListSetId
      }
    });
    console.log(`子チェックリスト項目を作成しました: ${childCheck1.name}`);

    const childCheck2 = await prisma.checkList.create({
      data: {
        id: ulid(),
        name: '契約日の記載',
        description: '契約締結日が明記され、両当事者の合意日と一致しているか',
        parentId: parentCheckId,
        itemType: 'SIMPLE',
        isConclusion: false,
        checkListSetId: checkListSetId
      }
    });
    console.log(`子チェックリスト項目を作成しました: ${childCheck2.name}`);

    // フローチャート型チェックリスト項目の作成
    const flowStartId = ulid();
    const flowStart = await prisma.checkList.create({
      data: {
        id: flowStartId,
        name: 'リース契約判定',
        description: 'この契約書がリース契約に該当するかの判断フロー',
        itemType: 'FLOW',
        isConclusion: false,
        checkListSetId: checkListSetId,
        flowData: {
          next_if_yes: 'yes_branch',
          next_if_no: 'no_branch',
          condition_type: 'YES_NO'
        }
      }
    });
    console.log(`フローチャート型チェックリスト項目を作成しました: ${flowStart.name}`);

    console.log('初期データの投入が完了しました');
  } catch (error) {
    console.error('初期データ投入エラー:', error);
    throw error;
  }
}

// スクリプトの実行
main();
