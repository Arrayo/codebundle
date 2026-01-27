import * as path from "path";
import ignore, { type Ignore } from "ignore";
import type { IFileSystem, ProgressReporter } from "../ports";
import type { Config, FileInfo } from "../models";

const DEFAULT_EXCLUDES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
]);

const DEFAULT_EXCLUDED_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svg",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".7z",
  ".mp4",
  ".mov",
  ".mp3",
  ".wav",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".map",
]);

const DEFAULT_EXCLUDED_GLOBS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  ".env",
  ".env.*",
  "*.pem",
  "*.key",
  "*.p12",
  "*.jks",
  "*.keystore",
  "id_rsa",
  "id_ed25519",
  "**/.DS_Store",
  "**/Thumbs.db",
];

const BINARY_DETECTION_BYTES = 512;

export class FileCollectorService {
  constructor(private readonly fileSystem: IFileSystem) {}

  async collectFiles(
    rootPath: string,
    outputFilePath: string,
    config: Config,
    progress: ProgressReporter
  ): Promise<{ files: FileInfo[]; skippedByBudget: boolean }> {
    const ig = await this.createIgnore(rootPath, config);

    const collected: FileInfo[] = [];
    const state = { totalBytes: 0, skippedByBudget: false };

    await this.walkDirectory({
      currentPath: rootPath,
      rootPath,
      outputFilePath,
      ig,
      config,
      collected,
      state,
      progress,
    });

    collected.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    return {
      files: collected.slice(0, config.maxFiles),
      skippedByBudget: state.skippedByBudget,
    };
  }

  private async createIgnore(rootPath: string, config: Config): Promise<Ignore> {
    const ig = ignore();

    ig.add(DEFAULT_EXCLUDED_GLOBS);
    ig.add(config.additionalExcludes);
    ig.add(config.excludeGlobs);

    await this.addIgnoreFile(ig, path.join(rootPath, ".gitignore"));
    await this.addIgnoreFile(ig, path.join(rootPath, ".git", "info", "exclude"));
    await this.addIgnoreFile(ig, path.join(rootPath, ".codebundleignore"));

    return ig;
  }

  private async addIgnoreFile(ig: Ignore, filePath: string): Promise<void> {
    try {
      const bytes = await this.fileSystem.readFile(filePath);
      const content = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      ig.add(content);
    } catch (error) {
      // File doesn't exist or can't be read, continue
    }
  }

  private async walkDirectory(args: {
    currentPath: string;
    rootPath: string;
    outputFilePath: string;
    ig: Ignore;
    config: Config;
    collected: FileInfo[];
    state: { totalBytes: number; skippedByBudget: boolean };
    progress: ProgressReporter;
  }): Promise<void> {
    const { currentPath, rootPath, outputFilePath, ig, config, collected, state, progress } = args;

    if (progress.isCancelled() || collected.length >= config.maxFiles) {
      return;
    }

    let entries: Array<{ name: string; isDirectory: boolean }>;
    try {
      entries = await this.fileSystem.readDirectory(currentPath);
    } catch (error) {
      console.warn(`Failed to read directory ${currentPath}:`, error);
      return;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (progress.isCancelled() || collected.length >= config.maxFiles) {
        return;
      }

      const entryPath = path.join(currentPath, entry.name);
      if (entryPath === outputFilePath) {
        continue;
      }

      const relativePath = this.toPosix(path.relative(rootPath, entryPath));
      const relativeForIgnore = entry.isDirectory ? relativePath + "/" : relativePath;

      if (DEFAULT_EXCLUDES.has(entry.name)) {
        continue;
      }

      if (this.isInExcludedPath(relativePath)) {
        continue;
      }

      if (!this.isIncludedByAllowlist(relativePath, config)) {
        continue;
      }

      if (ig.ignores(relativePath) || ig.ignores(relativeForIgnore)) {
        continue;
      }

      if (entry.isDirectory) {
        progress.report(`Scanning: ${relativePath || "."}`);
        await this.walkDirectory({
          currentPath: entryPath,
          rootPath,
          outputFilePath,
          ig,
          config,
          collected,
          state,
          progress,
        });
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (DEFAULT_EXCLUDED_EXTS.has(ext)) {
        continue;
      }

      let fileStat: { size: number };
      try {
        fileStat = await this.fileSystem.stat(entryPath);
      } catch (error) {
        console.warn(`Failed to stat file ${entryPath}:`, error);
        continue;
      }

      if (fileStat.size > config.maxFileBytes) {
        continue;
      }

      if (state.totalBytes + fileStat.size > config.maxTotalBytes) {
        state.skippedByBudget = true;
        continue;
      }

      const isBinary = await this.isBinaryFile(entryPath);
      if (isBinary) {
        continue;
      }

      collected.push({
        relativePath,
        absolutePath: entryPath,
        size: fileStat.size,
      });

      state.totalBytes += fileStat.size;
    }
  }

  private isInExcludedPath(relativePath: string): boolean {
    const pathParts = relativePath.split("/");
    for (const part of pathParts) {
      if (DEFAULT_EXCLUDES.has(part)) {
        return true;
      }
    }
    return false;
  }

  private isIncludedByAllowlist(relativePath: string, config: Config): boolean {
    const allowList = config.includeGlobs;
    if (!allowList?.length) {
      return true;
    }

    for (const glob of allowList) {
      const normalized = glob.replaceAll("\\", "/").trim();
      if (!normalized) {
        continue;
      }

      if (normalized.endsWith("/**")) {
        const prefix = normalized.slice(0, -3);
        if (relativePath === prefix || relativePath.startsWith(prefix + "/")) {
          return true;
        }
        continue;
      }

      if (normalized.startsWith("**/*.")) {
        const suffix = normalized.slice(4);
        if (relativePath.endsWith(suffix)) {
          return true;
        }
        continue;
      }

      if (relativePath === normalized) {
        return true;
      }
    }

    return false;
  }

  private async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      const bytes = await this.fileSystem.readFile(filePath);
      const chunk = bytes.slice(0, BINARY_DETECTION_BYTES);
      return chunk.includes(0);
    } catch (error) {
      console.warn(`Failed to check if file is binary ${filePath}:`, error);
      return true;
    }
  }

  private toPosix(pathString: string): string {
    return pathString.replaceAll("\\", "/");
  }
}
