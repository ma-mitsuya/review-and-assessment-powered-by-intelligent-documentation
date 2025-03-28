import { Result, ok, err } from "../../core/utils/result";
import { S3Utils } from "../../core/utils/s3";
import { DbUtils, TableCreationParams } from "../../core/utils/db";
import { CsvUtils, CsvRow } from "../../core/utils/csv";
import { Connection } from "mysql2/promise";

/**
 * ETL処理のパラメータ
 */
export interface EtlParams {
  bucket: string;
  key: string;
}

/**
 * ETL処理の結果
 */
export interface EtlResult {
  tableName: string;
  rowsProcessed: number;
}

/**
 * ETL処理の依存関係
 */
export interface EtlDependencies {
  s3: S3Utils;
  db: DbUtils;
  csv: CsvUtils;
  dbSecretArn: string;
  dbName: string;
}

/**
 * CSVファイルをETL処理する純粋関数
 */
export async function processCsvFile(
  params: EtlParams,
  deps: EtlDependencies
): Promise<Result<EtlResult, Error>> {
  try {
    // S3からCSVファイルを取得
    const bufferResult = await deps.s3.getObject(params.key);
    if (!bufferResult.ok) {
      return err(bufferResult.error);
    }
    const buffer = bufferResult.value;

    // ファイル名からテーブル名を推測（例: csv/users.csv -> users）
    const fileName = params.key.split("/").pop() || "";
    const tableName = fileName.replace(".csv", "").toLowerCase();

    // CSVデータを解析
    const rowsResult = await deps.csv.parseCsvBuffer(buffer);
    if (!rowsResult.ok) {
      return err(rowsResult.error);
    }
    const rows = rowsResult.value;

    if (rows.length === 0) {
      return ok({ tableName, rowsProcessed: 0 });
    }

    // データベース接続情報を取得
    const credentialsResult = await deps.db.getCredentials(deps.dbSecretArn);
    if (!credentialsResult.ok) {
      return err(credentialsResult.error);
    }
    const credentials = credentialsResult.value;

    // データベースに接続
    const connectionResult = await deps.db.createConnection(credentials, deps.dbName);
    if (!connectionResult.ok) {
      return err(connectionResult.error);
    }
    const connection = connectionResult.value;

    try {
      // テーブルが存在しない場合は作成
      const columns = createColumnDefinitions(rows[0]);
      const tableResult = await deps.db.createTableIfNotExists(connection, {
        tableName,
        columns,
      });
      if (!tableResult.ok) {
        return err(tableResult.error);
      }

      // データをバッチ挿入
      const insertResult = await deps.db.insertBatch(connection, {
        tableName,
        rows,
      });
      if (!insertResult.ok) {
        return err(insertResult.error);
      }

      return ok({
        tableName,
        rowsProcessed: insertResult.value,
      });
    } finally {
      // 接続を閉じる
      await connection.end();
    }
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * CSVヘッダーからカラム定義を作成
 */
export function createColumnDefinitions(
  sampleRow: CsvRow
): Record<string, string> {
  const columns: Record<string, string> = {};
  
  for (const column of Object.keys(sampleRow)) {
    columns[column] = "VARCHAR(255)";
  }
  
  return columns;
}
