import * as vscode from "vscode";
import * as path from "path";
import type { IConfigService, IFileSystem } from "../../domain/ports";
import type { Config } from "../../domain/models";
import { DEFAULT_CONFIG } from "../../domain/models";

export class ConfigService implements IConfigService {
  constructor(private readonly fileSystem: IFileSystem) {}

  async loadConfig(rootPath: string): Promise<Config> {
    const configPath = path.join(rootPath, "codebundle.config.json");

    try {
      const bytes = await this.fileSystem.readFile(configPath);
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      const parsed = JSON.parse(text) as Partial<Config>;

      return this.mergeWithDefaults(parsed);
    } catch (error) {
      console.warn("Failed to load config, using defaults:", error);
      return DEFAULT_CONFIG;
    }
  }

  getAutoCopyToClipboard(): boolean {
    return vscode.workspace
      .getConfiguration("codebundle")
      .get<boolean>("autoCopyToClipboard", true);
  }

  getOpenAfterExport(): boolean {
    return vscode.workspace
      .getConfiguration("codebundle")
      .get<boolean>("openAfterExport", true);
  }

  private mergeWithDefaults(partial: Partial<Config>): Config {
    return {
      maxFiles: this.clampInt(partial.maxFiles, DEFAULT_CONFIG.maxFiles, 1, 100_000),
      maxFileBytes: this.clampInt(partial.maxFileBytes, DEFAULT_CONFIG.maxFileBytes, 1, 50_000_000),
      maxTotalBytes: this.clampInt(partial.maxTotalBytes, DEFAULT_CONFIG.maxTotalBytes, 1, 200_000_000),
      maxFileLines: this.clampInt(partial.maxFileLines, DEFAULT_CONFIG.maxFileLines, 1, 200_000),

      additionalExcludes: Array.isArray(partial.additionalExcludes)
        ? partial.additionalExcludes
        : DEFAULT_CONFIG.additionalExcludes,

      includeProjectTree: partial.includeProjectTree ?? DEFAULT_CONFIG.includeProjectTree,

      includeGlobs: Array.isArray(partial.includeGlobs)
        ? partial.includeGlobs
        : DEFAULT_CONFIG.includeGlobs,

      excludeGlobs: Array.isArray(partial.excludeGlobs)
        ? partial.excludeGlobs
        : DEFAULT_CONFIG.excludeGlobs,

      redact: partial.redact ?? DEFAULT_CONFIG.redact,
      redactMask: typeof partial.redactMask === "string" 
        ? partial.redactMask 
        : DEFAULT_CONFIG.redactMask,

      redactionRules: this.validateRedactionRules(partial.redactionRules) 
        ? partial.redactionRules! 
        : DEFAULT_CONFIG.redactionRules,
    };
  }

  private validateRedactionRules(rules: unknown): rules is Config["redactionRules"] {
    if (!Array.isArray(rules)) {
      return false;
    }

    for (const rule of rules) {
      if (rule.type === "regex") {
        try {
          new RegExp(rule.pattern, rule.flags);
        } catch {
          console.warn(`Invalid regex pattern in redaction rule: ${rule.pattern}`);
          return false;
        }
      }
    }

    return true;
  }

  private clampInt(value: unknown, fallback: number, min: number, max: number): number {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, Math.trunc(num)));
  }
}
