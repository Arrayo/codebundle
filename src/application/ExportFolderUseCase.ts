import * as path from "path";
import * as os from "os";
import type {
  IFileSystem,
  IUIService,
  IClipboard,
  IConfigService,
  ProgressReporter,
} from "../domain/ports";
import { FileCollectorService, BundleGeneratorService } from "../domain/services";

export class ExportFolderUseCase {
  private readonly fileCollector: FileCollectorService;
  private readonly bundleGenerator: BundleGeneratorService;

  constructor(
    private readonly fileSystem: IFileSystem,
    private readonly uiService: IUIService,
    private readonly clipboard: IClipboard,
    private readonly configService: IConfigService
  ) {
    this.fileCollector = new FileCollectorService(fileSystem);
    this.bundleGenerator = new BundleGeneratorService(fileSystem);
  }

  async execute(rootPath: string): Promise<void> {
    const config = await this.configService.loadConfig(rootPath);

    const defaultSavePath = await this.resolveDefaultSavePath(rootPath);
    const saveUri = await this.uiService.showSaveDialog(defaultSavePath);

    if (!saveUri) {
      return;
    }

    await this.uiService.withProgress(
      "CodeBundle: generating markdown bundle…",
      async (progress: ProgressReporter) => {
        const { files, skippedByBudget } = await this.fileCollector.collectFiles(
          rootPath,
          saveUri,
          config,
          progress
        );

        if (progress.isCancelled()) {
          return;
        }

        const result = await this.bundleGenerator.generateBundle(
          rootPath,
          files,
          config,
          skippedByBudget,
          progress
        );

        if (progress.isCancelled()) {
          return;
        }

        await this.fileSystem.writeFile(saveUri, Buffer.from(result.markdown, "utf8"));

        const autoCopy = this.configService.getAutoCopyToClipboard();
        let copied = false;

        if (autoCopy) {
          try {
            await this.clipboard.writeText(result.markdown);
            copied = true;
            console.log("CodeBundle: Markdown copied to clipboard");
          } catch (error) {
            console.error("CodeBundle: Failed to copy to clipboard:", error);
            this.uiService.showInformationMessage(
              "Warning: Could not copy to clipboard. File saved successfully."
            );
          }
        }

        const openAfterExport = this.configService.getOpenAfterExport();
        if (openAfterExport) {
          try {
            await this.uiService.openTextDocument(saveUri);
          } catch (error) {
            console.error("CodeBundle: Failed to open document:", error);
          }
        }

        const message = `CodeBundle: generated ${path.basename(saveUri)} (${files.length} files)${
          copied ? " — copied to clipboard" : ""
        }`;

        this.uiService.showInformationMessage(message);
      }
    );
  }

  private generateDefaultFileName(rootPath: string): string {
    const projectName = path.basename(rootPath);
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${projectName}-${year}-${month}${day}-${hours}${minutes}${seconds}.md`;
  }

  private async resolveDefaultSavePath(rootPath: string): Promise<string> {
    const fileName = this.generateDefaultFileName(rootPath);
    const configuredFolder = this.configService.getDefaultOutputFolder().trim();

    if (!configuredFolder) {
      return path.join(rootPath, fileName);
    }

    const resolvedFolder = this.resolveVariables(configuredFolder, rootPath);

    try {
      const stat = await this.fileSystem.stat(resolvedFolder);
      if (stat) {
        return path.join(resolvedFolder, fileName);
      }
    } catch {
      // Folder doesn't exist, fallback to project root
    }

    return path.join(rootPath, fileName);
  }

  private resolveVariables(folder: string, rootPath: string): string {
    return folder
      .replace(/\$\{userHome\}/g, os.homedir())
      .replace(/\$\{workspaceFolder\}/g, rootPath)
      .replace(/^~/, os.homedir());
  }
}
