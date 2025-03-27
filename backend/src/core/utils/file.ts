import path from "path";

/**
 * ファイルタイプ
 */
export type FileType = "pdf" | "word" | "excel" | "image" | "text" | "unknown";

export function getFileType(fileName: string): FileType {
  const ext = path.extname(fileName).toLowerCase();

  switch (ext) {
    case ".pdf":
      return "pdf";
    case ".doc":
    case ".docx":
      return "word";
    case ".xls":
    case ".xlsx":
      return "excel";
    case ".png":
    case ".jpg":
      return "image";
    case ".txt":
      return "text";
    default:
      console.warn(`未対応のファイル形式: ${ext}`);
      return "unknown";
  }
}
