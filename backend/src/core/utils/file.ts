/**
 * ファイル操作ユーティリティ
 */

/**
 * ファイルタイプの列挙型
 */
export enum FileType {
  PDF = 'pdf',
  IMAGE = 'image',
  EXCEL = 'excel',
  WORD = 'word',
  TEXT = 'text',
  UNKNOWN = 'unknown'
}

/**
 * ファイル名から拡張子を取得する
 * @param filename ファイル名
 * @returns 拡張子（ドットを含まない）
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * ファイル名からファイルタイプを推測する
 * @param filename ファイル名
 * @returns ファイルタイプ
 */
export function getFileType(filename: string): FileType {
  const ext = getFileExtension(filename);
  
  switch (ext) {
    case 'pdf':
      return FileType.PDF;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'tiff':
    case 'tif':
    case 'bmp':
    case 'webp':
      return FileType.IMAGE;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return FileType.EXCEL;
    case 'doc':
    case 'docx':
      return FileType.WORD;
    case 'txt':
    case 'md':
    case 'rtf':
      return FileType.TEXT;
    default:
      return FileType.UNKNOWN;
  }
}

/**
 * ファイル名からMIMEタイプを推測する
 * @param filename ファイル名
 * @returns MIMEタイプ
 */
export function getMimeTypeFromFilename(filename: string): string {
  const ext = getFileExtension(filename);
  
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'txt':
      return 'text/plain';
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    case 'xml':
      return 'application/xml';
    case 'html':
    case 'htm':
      return 'text/html';
    default:
      return 'application/octet-stream';
  }
}
