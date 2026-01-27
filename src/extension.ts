import * as vscode from "vscode";
import { ExportFolderUseCase } from "./application/ExportFolderUseCase";
import { VSCodeFileSystem } from "./infrastructure/vscode/VSCodeFileSystem";
import { VSCodeUIService } from "./infrastructure/vscode/VSCodeUIService";
import { VSCodeClipboard } from "./infrastructure/vscode/VSCodeClipboard";
import { ConfigService } from "./infrastructure/config/ConfigService";
import { FolderResolver } from "./infrastructure/vscode/FolderResolver";

export function activate(context: vscode.ExtensionContext) {
  const fileSystem = new VSCodeFileSystem();
  const uiService = new VSCodeUIService();
  const clipboard = new VSCodeClipboard();
  const configService = new ConfigService(fileSystem);
  const folderResolver = new FolderResolver(uiService);

  const exportUseCase = new ExportFolderUseCase(
    fileSystem,
    uiService,
    clipboard,
    configService
  );

  const command = vscode.commands.registerCommand(
    "codebundle.exportFolderToMarkdown",
    async (folderUri?: vscode.Uri) => {
      try {
        const rootPath = await folderResolver.resolve(folderUri);
        await exportUseCase.execute(rootPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`CodeBundle: ${message}`);
      }
    }
  );

  context.subscriptions.push(command);
}

export function deactivate() {}
