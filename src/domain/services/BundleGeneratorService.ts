import * as path from "path";
import type { IFileSystem, ProgressReporter } from "../ports";
import type { Config, FileInfo, FileContent, Truncation, BundleResult } from "../models";
import { RedactionService } from "./RedactionService";

export class BundleGeneratorService {
  private readonly redactionService: RedactionService;

  constructor(private readonly fileSystem: IFileSystem) {
    this.redactionService = new RedactionService();
  }

  async generateBundle(
    rootPath: string,
    files: FileInfo[],
    config: Config,
    skippedByBudget: boolean,
    progress: ProgressReporter
  ): Promise<BundleResult> {
    const truncations: Truncation[] = [];

    const header = this.buildHeader(rootPath, files, config);
    const fileList = this.buildFileList(files);

    const fileContents: string[] = [];

    for (let i = 0; i < files.length; i++) {
      if (progress.isCancelled()) {
        break;
      }

      const file = files[i];
      progress.report(`Bundling (${i + 1}/${files.length}): ${file.relativePath}`);

      const content = await this.processFile(file, config, truncations);
      fileContents.push(content);
    }

    const footer = this.buildFooter(truncations, skippedByBudget, config);
    const markdown = [header, fileList, ...fileContents, footer].join("\n");

    return {
      markdown,
      filesIncluded: files,
      truncations,
      skippedByBudget,
    };
  }

  private buildHeader(rootPath: string, files: FileInfo[], config: Config): string {
    const lines = [
      `# CodeBundle: ${path.basename(rootPath)}`,
      `Generated: ${new Date().toISOString()}`,
      `Root: ${rootPath}`,
      `Files: ${files.length}`,
      "",
      "## How to apply changes",
      "- Return changes as **unified diffs** per file whenever possible.",
      "- Files are delimited with `<!-- FILE: ... -->` markers.",
      "",
    ];

    if (config.includeProjectTree) {
      const tree = this.buildProjectTree(files);
      lines.push("## Project tree", "```", tree, "```", "");
    }

    return lines.join("\n");
  }

  private buildFileList(files: FileInfo[]): string {
    const lines = ["## Files list", ""];
    for (const file of files) {
      lines.push(`- \`${file.relativePath}\` (${file.size} bytes)`);
    }
    lines.push("");
    return lines.join("\n");
  }

  private async processFile(
    file: FileInfo,
    config: Config,
    truncations: Truncation[]
  ): Promise<string> {
    let bytes: Uint8Array;
    try {
      bytes = await this.fileSystem.readFile(file.absolutePath);
    } catch (error) {
      console.warn(`Failed to read file ${file.absolutePath}:`, error);
      return "";
    }

    const decoder = new TextDecoder("utf-8", { fatal: false });
    let content = decoder.decode(bytes).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    content = this.redactionService.redactContent(content, config);

    content = this.truncateByBytes(content, file, config, truncations);
    content = this.truncateByLines(content, file, config, truncations);

    if (!content.endsWith("\n")) {
      content += "\n";
    }

    const lang = this.langFromExt(path.extname(file.relativePath), file.relativePath);

    return [
      "---",
      `<!-- FILE: ${file.relativePath} -->`,
      `## ${file.relativePath}`,
      "",
      "```" + lang,
      content,
      "```",
      "<!-- END_FILE -->",
      "",
    ].join("\n");
  }

  private truncateByBytes(
    content: string,
    file: FileInfo,
    config: Config,
    truncations: Truncation[]
  ): string {
    if (content.length <= config.maxFileBytes) {
      return content;
    }

    const kept = content.slice(0, config.maxFileBytes);
    truncations.push({
      relativePath: file.relativePath,
      reason: "bytes",
      original: content.length,
      kept: kept.length,
    });

    return kept + "\n/* … truncated by bytes … */\n";
  }

  private truncateByLines(
    content: string,
    file: FileInfo,
    config: Config,
    truncations: Truncation[]
  ): string {
    const lines = content.split("\n");
    if (lines.length <= config.maxFileLines) {
      return content;
    }

    const keptLines = lines.slice(0, config.maxFileLines);
    truncations.push({
      relativePath: file.relativePath,
      reason: "lines",
      original: lines.length,
      kept: keptLines.length,
    });

    return keptLines.join("\n") + "\n/* … truncated by lines … */\n";
  }

  private buildFooter(
    truncations: Truncation[],
    skippedByBudget: boolean,
    config: Config
  ): string {
    const lines = ["---", "## Bundle notes"];

    if (config.includeGlobs?.length) {
      lines.push(
        `- Allowlist (includeGlobs): ${config.includeGlobs.map((s) => `\`${s}\``).join(", ")}`
      );
    }

    if (skippedByBudget) {
      lines.push("- Some files were skipped due to **maxTotalBytes** budget.");
    }

    if (config.redact) {
      lines.push(`- Redaction: enabled (mask: \`${config.redactMask}\`).`);
    }

    if (truncations.length) {
      lines.push("- Some files were truncated:");
      for (const t of truncations) {
        lines.push(`  - \`${t.relativePath}\` (${t.reason}): kept ${t.kept} / ${t.original}`);
      }
    } else {
      lines.push("- No truncations.");
    }

    lines.push("");
    return "\n" + lines.join("\n") + "\n";
  }

  private buildProjectTree(files: FileInfo[]): string {
    type Node = { children: Map<string, Node> };
    const root: Node = { children: new Map() };

    for (const file of files) {
      const parts = file.relativePath.split("/");
      let current = root;
      for (const part of parts) {
        const next = current.children.get(part) ?? { children: new Map() };
        current.children.set(part, next);
        current = next;
      }
    }

    const output: string[] = [];
    const walkNode = (node: Node, prefix: string) => {
      const entries = [...node.children.entries()].sort(([a], [b]) => a.localeCompare(b));
      for (let i = 0; i < entries.length; i++) {
        const [name, child] = entries[i];
        const isLast = i === entries.length - 1;
        output.push(prefix + (isLast ? "└─ " : "├─ ") + name);
        const nextPrefix = prefix + (isLast ? "   " : "│  ");
        if (child.children.size) {
          walkNode(child, nextPrefix);
        }
      }
    };

    walkNode(root, "");
    return output.join("\n");
  }

  private langFromExt(ext: string, relPath: string): string {
    const lowerExt = ext.toLowerCase();
    const lower = relPath.toLowerCase();

    if (lower.endsWith(".d.ts")) {
      return "ts";
    }

    const extMap: Record<string, string> = {
      ".ts": "ts",
      ".tsx": "tsx",
      ".js": "js",
      ".mjs": "js",
      ".cjs": "js",
      ".jsx": "jsx",
      ".py": "py",
      ".graphql": "graphql",
      ".gql": "graphql",
      ".json": "json",
      ".yml": "yaml",
      ".yaml": "yaml",
      ".md": "md",
      ".css": "css",
      ".scss": "scss",
      ".html": "html",
      ".sql": "sql",
      ".php": "php",
      ".sh": "sh",
      ".zsh": "sh",
      ".toml": "toml",
      ".ini": "ini",
      ".java": "java",
      ".go": "go",
      ".rs": "rust",
      ".c": "c",
      ".cpp": "cpp",
      ".cc": "cpp",
      ".cxx": "cpp",
      ".h": "cpp",
      ".hpp": "cpp",
    };

    return extMap[lowerExt] ?? "";
  }
}
