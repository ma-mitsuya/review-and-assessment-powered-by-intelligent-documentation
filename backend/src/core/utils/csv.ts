import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { Result, ok, err } from './result';

/**
 * CSVファイルの行データ型
 */
export interface CsvRow {
  [key: string]: string;
}

/**
 * CSVユーティリティクラス
 */
export class CsvUtils {
  /**
   * CSVバッファをパースして行データの配列を返す
   */
  async parseCsvBuffer(buffer: Buffer): Promise<Result<CsvRow[], Error>> {
    try {
      const rows = await this.parseCsvStream(Readable.from(buffer));
      return ok(rows);
    } catch (error) {
      console.error('Error parsing CSV buffer:', error);
      return err(
        error instanceof Error
          ? error
          : new Error('Error parsing CSV buffer')
      );
    }
  }

  /**
   * CSVストリームをパースして行データの配列を返す
   */
  private parseCsvStream(stream: Readable): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const rows: CsvRow[] = [];
      
      stream
        .pipe(csvParser())
        .on('data', (row: CsvRow) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', (error: Error) => reject(error));
    });
  }
}

export function createCsvUtils(): CsvUtils {
  return new CsvUtils();
}
