import * as vscode from "vscode";
import type { IFileSystem } from "../../domain/ports";

export class VSCodeFileSystem implements IFileSystem {
  async readFile(path: string): Promise<Uint8Array> {
    const uri = vscode.Uri.file(path);
    return await vscode.workspace.fs.readFile(uri);
  }

  async readDirectory(path: string): Promise<Array<{ name: string; isDirectory: boolean }>> {
    const uri = vscode.Uri.file(path);
    const entries = await vscode.workspace.fs.readDirectory(uri);

    return entries.map(([name, type]) => ({
      name,
      isDirectory: type === vscode.FileType.Directory,
    }));
  }

  async stat(path: string): Promise<{ size: number }> {
    const uri = vscode.Uri.file(path);
    const stat = await vscode.workspace.fs.stat(uri);
    return { size: stat.size };
  }

  async writeFile(path: string, content: Uint8Array): Promise<void> {
    const uri = vscode.Uri.file(path);
    await vscode.workspace.fs.writeFile(uri, content);
  }
}
