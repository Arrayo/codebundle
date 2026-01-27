# CodeBundle

Export your entire codebase into a single AI-optimized Markdown file for LLMs (ChatGPT, Claude, etc.) and documentation.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Arrayo/codebundle)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/Arrayo/codebundle/blob/main/LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.105%2B-blue?logo=visual-studio-code)](https://code.visualstudio.com/)

> **Perfect for AI code review, documentation generation, and sharing entire projects with ChatGPT, Claude, or any LLM.**

## ✨ Features

- 📦 **Export complete projects** into a single structured Markdown file
- 🤖 **AI-optimized** - perfect format for ChatGPT, Claude and other LLMs
- 🔒 **Automatic redaction** of secrets, API keys and sensitive data (best-effort)
- 🎯 **Flexible filtering** with include/exclude globs and `.gitignore` support
- 🌳 **Project tree** for better visual context
- 📋 **Auto-copy** to clipboard for instant use
- ⚡ **High limits (configurable)** - up to **100MB** and **10K files**
- 🎨 **Syntax highlighting** with automatic language detection
- 📏 **Smart truncation** of large files with clear indicators

## 📦 Install

Search for **CodeBundle** in your editor's Extensions marketplace.

Extension ID (Open VSX / Cursor / Windsurf):
- `arrayo.codebundle`

Legacy ID (previous namespace):
- `francisco.codebundle`

## 🚀 Usage

### From the file explorer

1. **Right-click** any folder in VS Code explorer
2. Select **"CodeBundle: Export Folder to Markdown"**
3. Choose where to save the `.md` file
4. Done! The bundle is generated and automatically copied to clipboard

### From the command palette

1. Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type: **CodeBundle: Export Folder to Markdown**
3. Select the folder to export
4. Save the generated file

## ⚙️ Configuration

### VS Code Settings

Open VS Code settings (`Ctrl+,` / `Cmd+,`) and search for **"CodeBundle"**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `codebundle.autoCopyToClipboard` | boolean | `true` | Automatically copy to clipboard |
| `codebundle.openAfterExport` | boolean | `true` | Automatically open exported file |
| `codebundle.defaultOutputFolder` | string | `""` | Default folder for saving bundles. Supports `${userHome}`, `${workspaceFolder}`, and `~`. Falls back to project folder if empty or doesn't exist. |

**Examples for `defaultOutputFolder`:**
```json
"codebundle.defaultOutputFolder": "${userHome}/Downloads"
"codebundle.defaultOutputFolder": "~/Documents/CodeBundles"
"codebundle.defaultOutputFolder": "${workspaceFolder}/exports"
```

### Advanced Configuration (optional)

Create a `codebundle.config.json` file in your project root:

```json
{
  "includeProjectTree": true,
  "maxFiles": 10000,
  "maxFileBytes": 5000000,
  "maxTotalBytes": 100000000,
  "maxFileLines": 50000,
  "includeGlobs": ["src/**", "lib/**"],
  "excludeGlobs": ["**/*.test.ts", "**/__mocks__/**"],
  "redact": true,
  "redactMask": "***REDACTED***"
}
```

#### Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeProjectTree` | boolean | `true` | Include ASCII tree of the structure |
| `maxFiles` | number | `10000` | Maximum number of files |
| `maxFileBytes` | number | `5000000` | Maximum bytes per file (5MB) |
| `maxTotalBytes` | number | `100000000` | Maximum total bundle size (100MB) |
| `maxFileLines` | number | `50000` | Maximum lines per file |
| `includeGlobs` | string[] | `[]` | Include patterns (empty = include all) |
| `excludeGlobs` | string[] | `[]` | Exclude patterns |
| `additionalExcludes` | string[] | `[]` | Extra folders to exclude |
| `redact` | boolean | `true` | Enable sensitive data redaction |
| `redactMask` | string | `"***REDACTED***"` | Replacement text for redacted content |
| `redactionRules` | array | (defaults) | Custom redaction rules |

### Default Exclusions

CodeBundle automatically excludes:

**Folders**: `node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`

**Files**: `.env*`, `*.pem`, `*.key`, binary files (images, videos, fonts, etc.)

**Respects**: `.gitignore`, `.git/info/exclude`, `.codebundleignore`

### Custom Redaction Rules

```json
{
  "redactionRules": [
    {
      "type": "keyValue",
      "keys": ["password", "secret"],
      "mask": "***HIDDEN***"
    },
    {
      "type": "regex",
      "pattern": "\\b[A-Z0-9]{32}\\b",
      "flags": "g",
      "replace": "***TOKEN***"
    }
  ]
}
```

## 💡 Use Cases

### 🤖 AI Code Review

Share your entire codebase with ChatGPT or Claude for:
- Architecture review
- Bug detection
- Performance optimization
- Security audit
- Code refactoring

### 📚 Documentation

Generate documentation bundles for:
- Onboarding new developers
- Knowledge transfer
- Project handoffs
- Code archives

### 🔍 Analysis

Create snapshots for:
- Dependency analysis
- Code metrics
- Migration planning
- Technical debt assessment

## 🛡️ Security

CodeBundle includes **automatic redaction** of sensitive data (best-effort):

✅ API keys (`apiKey`, `api_key`, `token`, etc.)  
✅ Authentication tokens (Bearer tokens)  
✅ AWS keys (`AKIA...` format)  
✅ Private keys (PEM format)  
✅ Passwords and secrets

⚠️ **Always review the generated bundle before sharing it.** No redaction system can guarantee 100% detection.

You can customize redaction rules in the configuration file.

## 📄 Output Format

```markdown
# CodeBundle: project-name
Generated: 2026-01-27T10:30:00.000Z
Root: /path/to/project
Files: 42

## Project tree
├─ src/
│  ├─ index.ts
│  └─ utils.ts

## Files list
- `src/index.ts` (1024 bytes)
- `src/utils.ts` (512 bytes)

---
<!-- FILE: src/index.ts -->
## src/index.ts

​```ts
export function main() {
  console.log("Hello");
}
​```
<!-- END_FILE -->
```

## 📝 License

MIT © Francisco Caballero Portero

## 🤝 Support

Issues or suggestions? Open an issue on the GitHub repository:  
https://github.com/Arrayo/codebundle/issues
