import * as path from "path";
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

    const defaultSavePath = path.join(rootPath, "codebundle.md");
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
}
