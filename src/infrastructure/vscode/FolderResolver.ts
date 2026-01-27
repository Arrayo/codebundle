import * as vscode from "vscode";
import type { IUIService } from "../../domain/ports";

export class FolderResolver {
  constructor(private readonly uiService: IUIService) {}

  async resolve(folderUri?: vscode.Uri): Promise<string> {
    if (folderUri?.scheme === "file") {
      return folderUri.fsPath;
    }

    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (workspace?.uri?.scheme === "file") {
      return workspace.uri.fsPath;
    }

    const selected = await this.uiService.showFolderDialog();
    if (!selected) {
      throw new Error("No folder selected");
    }

    return selected;
  }
}
