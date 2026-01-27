export interface FileInfo {
  relativePath: string;
  absolutePath: string;
  size: number;
}

export interface FileContent {
  info: FileInfo;
  content: string;
}

export interface Truncation {
  relativePath: string;
  reason: "lines" | "bytes";
  original: number;
  kept: number;
}
