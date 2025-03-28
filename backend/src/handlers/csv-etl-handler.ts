import "source-map-support/register";
import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { processCsvFile } from '../features/csv-etl/csv-etl';
import { createS3Utils, createDbUtils, createCsvUtils } from '../core/utils';
import { unwrapOrThrow } from '../core/utils/result';

// 環境変数
const DOCUMENT_BUCKET = process.env.DOCUMENT_BUCKET || '';
const CSV_PREFIX = process.env.CSV_PREFIX || 'csv/';
const DB_SECRET_ARN = process.env.DB_SECRET_ARN || '';
const DB_NAME = process.env.DB_NAME || 'beacon';

/**
 * SQSイベントハンドラー
 */
export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  console.log(`Processing ${event.Records.length} messages`);

  try {
    // 各SQSメッセージを処理
    for (const record of event.Records) {
      await processRecord(record);
    }
    
    console.log('Successfully processed all messages');
  } catch (error) {
    console.error('Error processing messages:', error);
    throw error;
  }
};

/**
 * 個別のSQSレコードを処理
 */
async function processRecord(record: SQSRecord): Promise<void> {
  try {
    const body = JSON.parse(record.body);
    
    // S3イベント通知からバケット名とキーを取得
    const bucket = body.Records[0].s3.bucket.name;
    const key = decodeURIComponent(body.Records[0].s3.object.key.replace(/\+/g, ' '));
    
    console.log(`Processing file: s3://${bucket}/${key}`);
    
    // CSVプレフィックスのチェック
    if (!key.startsWith(CSV_PREFIX)) {
      console.log(`Skipping file ${key} as it doesn't match the prefix ${CSV_PREFIX}`);
      return;
    }
    
    // 依存関係の作成
    const s3 = createS3Utils(bucket);
    const db = createDbUtils();
    const csv = createCsvUtils();
    
    // CSVファイルを処理
    const result = await processCsvFile(
      {
        bucket,
        key,
      },
      {
        s3,
        db,
        csv,
        dbSecretArn: DB_SECRET_ARN,
        dbName: DB_NAME,
      }
    );
    
    // 結果を処理
    const etlResult = unwrapOrThrow(result);
    console.log(`Successfully processed ${etlResult.rowsProcessed} rows into table ${etlResult.tableName}`);
    
  } catch (error) {
    console.error('Error processing record:', error);
    throw error;
  }
}
