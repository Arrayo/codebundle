import * as vscode from "vscode";
import type { IUIService, ProgressReporter } from "../../domain/ports";

export class VSCodeUIService implements IUIService {
  async showSaveDialog(defaultPath: string): Promise<string | undefined> {
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(defaultPath),
      filters: { Markdown: ["md"] },
      saveLabel: "Save bundle",
    });

    return uri?.fsPath;
  }

  async showFolderDialog(): Promise<string | undefined> {
    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: "Select folder",
    });

    return uris?.[0]?.fsPath;
  }

  showInformationMessage(message: string): void {
    vscode.window.showInformationMessage(message);
  }

  async openTextDocument(path: string): Promise<void> {
    const uri = vscode.Uri.file(path);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  async withProgress<T>(
    title: string,
    task: (progress: ProgressReporter) => Promise<T>
  ): Promise<T> {
    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: true,
      },
      async (vscodeProgress, token) => {
        const reporter: ProgressReporter = {
          report: (message: string) => {
            vscodeProgress.report({ message });
          },
          isCancelled: () => token.isCancellationRequested,
        };

        return await task(reporter);
      }
    );
  }
}
