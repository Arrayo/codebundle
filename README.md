# CodeBundle

> Export entire folders into a single AI-optimized Markdown file for LLMs and documentation

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- 📦 **Bundle entire projects** into a single Markdown file
- 🤖 **AI-optimized format** perfect for ChatGPT, Claude, and other LLMs
- 🔒 **Smart redaction** automatically masks secrets, API keys, and sensitive data
- 🎯 **Flexible filtering** with include/exclude globs and gitignore support
- 🌳 **Project tree visualization** for better context understanding
- 📋 **Auto-clipboard** copy for instant sharing
- ⚡ **Performance limits** to prevent huge bundles (configurable)
- 🎨 **Syntax highlighting** with language detection
- 📏 **Smart truncation** for large files with clear indicators

## Installation

1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
4. Click the `...` menu → "Install from VSIX..."
5. Select the downloaded file

## Usage

### Quick Start

1. Right-click any folder in the Explorer
2. Select **"CodeBundle: Export Folder to Markdown"**
3. Choose where to save the `.md` file
4. Done! The bundle is generated and copied to your clipboard

### Command Palette

Press `Ctrl+Shift+P` / `Cmd+Shift+P` and search for:
```
CodeBundle: Export Folder to Markdown
```

## Configuration

Create a `codebundle.config.json` in your project root:

```json
{
  "includeProjectTree": true,
  "maxFiles": 2000,
  "maxFileBytes": 512000,
  "maxTotalBytes": 3000000,
  "maxFileLines": 2500,
  "includeGlobs": ["src/**", "lib/**"],
  "excludeGlobs": ["**/*.test.ts", "**/__mocks__/**"],
  "redact": true,
  "redactMask": "***REDACTED***"
}
```

### Settings

Access via VS Code Settings (`Ctrl+,` / `Cmd+,`) → search for "CodeBundle":

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `codebundle.autoCopyToClipboard` | boolean | `true` | Auto-copy the generated bundle to clipboard |
| `codebundle.openAfterExport` | boolean | `true` | Auto-open the exported file in editor |

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeProjectTree` | boolean | `true` | Include ASCII tree of project structure |
| `maxFiles` | number | `2000` | Maximum number of files to include |
| `maxFileBytes` | number | `512000` | Maximum bytes per file |
| `maxTotalBytes` | number | `3000000` | Maximum total bundle size |
| `maxFileLines` | number | `2500` | Maximum lines per file |
| `includeGlobs` | string[] | `[]` | Whitelist patterns (empty = include all) |
| `excludeGlobs` | string[] | `[]` | Blacklist patterns |
| `additionalExcludes` | string[] | `[]` | Extra folders to exclude |
| `redact` | boolean | `true` | Enable sensitive data redaction |
| `redactMask` | string | `"***REDACTED***"` | Replacement text for redacted content |
| `redactionRules` | array | (defaults) | Custom redaction patterns |

### Default Exclusions

CodeBundle automatically excludes:

**Folders**: `node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`

**Files**: `.env*`, `*.pem`, `*.key`, binary files (images, videos, fonts, etc.)

**Respects**: `.gitignore`, `.git/info/exclude`, `.codebundleignore`

## Redaction Rules

### Built-in Protection

Automatically redacts:
- API keys (`apiKey`, `api_key`, etc.)
- Tokens and secrets
- Bearer tokens in headers
- AWS access keys
- Private keys (PEM format)

### Custom Rules

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

## Output Format

```markdown
# CodeBundle: project-name
Generated: 2026-01-27T10:30:00.000Z
Root: /path/to/project
Files: 42

## Project tree
```
├─ src/
│  ├─ index.ts
│  └─ utils.ts
```

## Files list
- `src/index.ts` (1024 bytes)
- `src/utils.ts` (512 bytes)

---
<!-- FILE: src/index.ts -->
## src/index.ts

```ts
export function main() {
  console.log("Hello");
}
```
<!-- END_FILE -->
```

## Use Cases

### 🤖 AI Code Review
Share your entire codebase with ChatGPT or Claude for:
- Architecture review
- Bug detection
- Performance optimization
- Security audit

### 📚 Documentation
Generate comprehensive documentation bundles for:
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

## Architecture

Built with hexagonal architecture:
- **Domain**: Pure business logic (testable without VS Code)
- **Application**: Use cases orchestration
- **Infrastructure**: VS Code adapters

See ARCHITECTURE.md for details.

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch

# Run tests
npm test

# Package extension
npm run package
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT © Francisco Caballero Portero

## Changelog

See the included CHANGELOG.md file for release history.

## Support

For issues or feature requests, please check the included CHANGELOG.md file for recent updates and known issues.

## Technical Details

Built with **hexagonal architecture** for maintainability and testability:
- **Domain Layer**: Pure business logic
- **Application Layer**: Use case orchestration
- **Infrastructure Layer**: VS Code adapters

See ARCHITECTURE.md (in project root) for complete technical documentation.

### Dependencies
- [ignore](https://github.com/kaelzhang/node-ignore) - gitignore parsing
- [esbuild](https://esbuild.github.io/) - fast bundling
- [TypeScript](https://www.typescriptlang.org/) - type safety
