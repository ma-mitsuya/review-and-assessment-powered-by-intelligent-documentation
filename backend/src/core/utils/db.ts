import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { createConnection, Connection } from "mysql2/promise";
import { Result, ok, err } from "./result";

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
 * テーブル作成パラメータ
 */
export interface TableCreationParams {
  tableName: string;
  columns: Record<string, string>;
}

/**
 * データ挿入パラメータ
 */
export interface DataInsertionParams<T> {
  tableName: string;
  rows: T[];
}

/**
 * データベースユーティリティクラス
 */
export class DbUtils {
  private secretsClient: SecretsManagerClient;

  constructor() {
    this.secretsClient = new SecretsManagerClient({});
  }

  /**
   * Secrets Managerからデータベース接続情報を取得
   */
  async getCredentials(secretArn: string): Promise<Result<DbCredentials, Error>> {
    try {
      const response = await this.secretsClient.send(
        new GetSecretValueCommand({
          SecretId: secretArn,
        })
      );
      
      if (!response.SecretString) {
        return err(new Error("Secret string is empty"));
      }
      
      const secret = JSON.parse(response.SecretString);
      
      return ok({
        username: secret.username,
        password: secret.password,
        host: secret.host,
        port: secret.port || 3306,
      });
    } catch (error) {
      console.error("Error retrieving database credentials:", error);
      return err(
        error instanceof Error
          ? error
          : new Error("Error retrieving database credentials")
      );
    }
  }

  /**
   * データベース接続を作成
   */
  async createConnection(
    credentials: DbCredentials,
    database: string
  ): Promise<Result<Connection, Error>> {
    try {
      const connection = await createConnection({
        host: credentials.host,
        user: credentials.username,
        password: credentials.password,
        database: database,
        port: credentials.port,
      });
      
      return ok(connection);
    } catch (error) {
      console.error("Error creating database connection:", error);
      return err(
        error instanceof Error
          ? error
          : new Error("Error creating database connection")
      );
    }
  }

  /**
   * テーブルが存在しない場合は作成
   */
  async createTableIfNotExists(
    connection: Connection,
    params: TableCreationParams
  ): Promise<Result<void, Error>> {
    try {
      // カラム定義を作成
      const columns = Object.entries(params.columns)
        .map(([column, type]) => `\`${column}\` ${type}`)
        .join(", ");
      
      // テーブル作成クエリ
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS \`${params.tableName}\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ${columns},
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await connection.query(createTableQuery);
      console.log(`Table ${params.tableName} created or already exists`);
      
      return ok(undefined);
    } catch (error) {
      console.error("Error creating table:", error);
      return err(
        error instanceof Error
          ? error
          : new Error("Error creating table")
      );
    }
  }

  /**
   * データをバッチ挿入
   */
  async insertBatch<T extends Record<string, any>>(
    connection: Connection,
    params: DataInsertionParams<T>
  ): Promise<Result<number, Error>> {
    if (params.rows.length === 0) return ok(0);
    
    // バッチサイズ
    const batchSize = 100;
    
    // カラム名
    const columns = Object.keys(params.rows[0]);
    
    try {
      // トランザクション開始
      await connection.beginTransaction();
      
      let totalInserted = 0;
      
      // バッチ処理
      for (let i = 0; i < params.rows.length; i += batchSize) {
        const batch = params.rows.slice(i, i + batchSize);
        
        // VALUES句を構築
        const values = batch.map((row) => {
          const rowValues = columns.map((col) => connection.escape(row[col])).join(", ");
          return `(${rowValues})`;
        }).join(", ");
        
        // INSERT文
        const insertQuery = `
          INSERT INTO \`${params.tableName}\` (${columns.map(c => `\`${c}\``).join(", ")})
          VALUES ${values}
        `;
        
        const [result]: any = await connection.query(insertQuery);
        totalInserted += result.affectedRows;
      }
      
      // コミット
      await connection.commit();
      
      return ok(totalInserted);
    } catch (error) {
      // エラー時はロールバック
      await connection.rollback();
      
      console.error("Error inserting data:", error);
      return err(
        error instanceof Error
          ? error
          : new Error("Error inserting data")
      );
    }
  }
}

export function createDbUtils(): DbUtils {
  return new DbUtils();
}
