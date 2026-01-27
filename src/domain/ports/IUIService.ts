export interface ProgressReporter {
  report(message: string): void;
  isCancelled(): boolean;
}

export interface IUIService {
  showSaveDialog(defaultPath: string): Promise<string | undefined>;
  showFolderDialog(): Promise<string | undefined>;
  showInformationMessage(message: string): void;
  openTextDocument(path: string): Promise<void>;
  withProgress<T>(
    title: string,
    task: (progress: ProgressReporter) => Promise<T>
  ): Promise<T>;
}
