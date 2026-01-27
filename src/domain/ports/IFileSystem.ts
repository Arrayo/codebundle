export interface IFileSystem {
  readFile(path: string): Promise<Uint8Array>;
  readDirectory(path: string): Promise<Array<{ name: string; isDirectory: boolean }>>;
  stat(path: string): Promise<{ size: number }>;
  writeFile(path: string, content: Uint8Array): Promise<void>;
}
