# Change Log

All notable changes to the "CodeBundle" extension will be documented in this file.

## [1.0.0] - 2026-01-27

### Added
- Hexagonal architecture with clean separation of concerns
- Complete TypeScript type safety
- Comprehensive test examples
- Architecture documentation
- Memory leak fixes
- Better error handling with logging
- Smart redaction with validation
- Configuration validation
- New setting: `openAfterExport` to control file opening behavior
- New setting: `defaultOutputFolder` with variable support (`${userHome}`, `${workspaceFolder}`, `~`)
- Automatic fallback to project folder if configured output folder doesn't exist
- GitHub repository links and badges

### Changed
- **Increased limits for large projects:**
  - Max files: 2,000 → 10,000
  - Max file size: 512KB → 5MB
  - Max total size: 3MB → 100MB
  - Max lines per file: 2,500 → 50,000
- Refactored from 742-line monolith to modular architecture
- Binary file detection now reads only first 512 bytes (performance improvement)
- Improved error messages with context
- Better progress reporting
- Enhanced README for VS Code Marketplace
- Optimized SEO with expanded keywords

### Removed
- Unused config properties: `includeToc`, `includeHashes`, `sort`
- Empty catch blocks replaced with proper error handling

### Fixed
- Memory leak when checking binary files
- Invalid regex patterns in redaction rules now detected
- Better handling of file system errors

## [0.0.1] - Initial Release

### Added
- Export folders to Markdown bundles
- Smart file filtering with gitignore support
- Automatic sensitive data redaction
- Project tree visualization
- Configurable size limits
- Auto-copy to clipboard
- Syntax highlighting in output
- File truncation with clear indicators
- Context menu integration
- Customizable redaction rules
