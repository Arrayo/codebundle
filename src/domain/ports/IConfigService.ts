import type { Config } from "../models";

export interface IConfigService {
  loadConfig(rootPath: string): Promise<Config>;
  getAutoCopyToClipboard(): boolean;
  getOpenAfterExport(): boolean;
  getDefaultOutputFolder(): string;
}
