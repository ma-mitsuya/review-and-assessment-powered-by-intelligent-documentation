/**
 * CSVファイルの行データ型
 */
export interface CsvRow {
  [key: string]: string;
}

/**
 * データベース接続情報
 */
export interface DbCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
}

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
 * テーブル作成パラメータ
 */
export interface TableCreationParams {
  tableName: string;
  columns: Record<string, string>;
}

/**
 * データ挿入パラメータ
 */
export interface DataInsertionParams {
  tableName: string;
  rows: CsvRow[];
}

/**
 * S3ユーティリティインターフェース
 */
export interface S3Utils {
  getObject(bucket: string, key: string): Promise<Buffer>;
}

/**
 * データベースユーティリティインターフェース
 */
export interface DbUtils {
  getCredentials(secretArn: string): Promise<DbCredentials>;
  createConnection(credentials: DbCredentials, database: string): Promise<any>;
  createTableIfNotExists(connection: any, params: TableCreationParams): Promise<void>;
  insertBatch(connection: any, params: DataInsertionParams): Promise<number>;
}

/**
 * CSV処理ユーティリティインターフェース
 */
export interface CsvUtils {
  parseCsvBuffer(buffer: Buffer): Promise<CsvRow[]>;
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
