# Publishing CodeBundle to VS Code Marketplace

## Prerequisites

1. **Microsoft Account**: Create one at https://account.microsoft.com
2. **Azure DevOps Account**: Sign up at https://dev.azure.com
3. **Personal Access Token (PAT)**: Required for publishing

## Step 1: Create Personal Access Token

1. Go to https://dev.azure.com
2. Click on your profile icon → **User settings** → **Personal access tokens**
3. Click **+ New Token**
4. Configure:
   - Name: `CodeBundle Publisher`
   - Organization: **All accessible organizations**
   - Expiration: Choose duration (recommended: 90 days or custom)
   - Scopes: Click **Show all scopes** → Select **Marketplace** → Check **Manage**
5. Click **Create** and **copy the token** (you won't see it again!)

## Step 2: Create Publisher Account

1. Go to https://marketplace.visualstudio.com/manage
2. Click **+ Create publisher**
3. Fill in:
   - **ID**: `francisco` (must match `package.json`)
   - **Name**: Your name or company
   - **Email**: Your email
4. Click **Create**

## Step 3: Install vsce

```bash
npm install -g @vscode/vsce
```

## Step 4: Login to Publisher

```bash
vsce login francisco
# Enter your Personal Access Token when prompted
```

## Step 5: Package Extension

```bash
npm run package
vsce package
```

This creates `codebundle-0.0.1.vsix`

## Step 6: Test Locally

Before publishing, test the `.vsix` file:

1. Open VS Code
2. Extensions → `...` menu → **Install from VSIX...**
3. Select `codebundle-0.0.1.vsix`
4. Test all features thoroughly

## Step 7: Publish

```bash
vsce publish
```

Or with specific version bump:

```bash
vsce publish patch   # 0.0.1 → 0.0.2
vsce publish minor   # 0.0.1 → 0.1.0
vsce publish major   # 0.0.1 → 1.0.0
```

## Step 8: Verify Publication

1. Go to https://marketplace.visualstudio.com/manage/publishers/francisco
2. Check that CodeBundle appears in your extensions
3. View it on marketplace: https://marketplace.visualstudio.com/items?itemName=francisco.codebundle

## Updating the Extension

1. Make your changes
2. Update `CHANGELOG.md` with changes
3. Update version in `package.json` or use:

```bash
npm version patch   # 0.0.1 → 0.0.2
npm version minor   # 0.0.1 → 0.1.0
npm version major   # 0.0.1 → 1.0.0
```

4. Package and publish:

```bash
npm run package
vsce publish
```

## Pre-Publish Checklist

- [ ] All tests pass: `npm test`
- [ ] No linter errors: `npm run lint`
- [ ] TypeScript compiles: `npm run check-types`
- [ ] Extension builds: `npm run package`
- [ ] CHANGELOG.md updated
- [ ] README.md up to date
- [ ] Version bumped in package.json
- [ ] Tested locally with .vsix
- [ ] All features work as expected
- [ ] No console errors in Extension Host

## Important Files for Publishing

| File | Required | Purpose |
|------|----------|---------|
| `package.json` | ✅ | Extension metadata |
| `README.md` | ✅ | Marketplace description |
| `CHANGELOG.md` | ✅ | Version history |
| `LICENSE` | ✅ | License information |
| `icon.png` | ⚠️ | Extension icon (128x128) |
| `.vscodeignore` | ✅ | Files to exclude from package |

## Adding an Icon

1. Create a 128x128 PNG image
2. Save as `icon.png` in root directory
3. Add to `package.json`:

```json
{
  "icon": "icon.png"
}
```

## Repository Setup (Recommended)

Add to `package.json`:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/codebundle.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/codebundle/issues"
  },
  "homepage": "https://github.com/yourusername/codebundle#readme"
}
```

## Unpublishing

⚠️ **Warning**: Unpublishing is irreversible!

```bash
vsce unpublish francisco.codebundle
```

Or specific version:

```bash
vsce unpublish francisco.codebundle@0.0.1
```

## Troubleshooting

### Error: "Personal Access Token is invalid"
- Create a new PAT with correct permissions
- Ensure **Marketplace → Manage** is selected
- Use `vsce login francisco` again

### Error: "Extension already exists"
- Check publisher ID matches in package.json
- Verify you're logged in as correct publisher
- Ensure version number is incremented

### Error: "Package size exceeds limit"
- Check `.vscodeignore` is excluding node_modules
- Remove unnecessary files from package
- Run `vsce ls` to see what will be included

### Package doesn't include TypeScript files
- Good! TypeScript files should be excluded
- Only compiled JavaScript in `dist/` is needed
- Verify with `vsce ls` command

## Useful Commands

```bash
# List files that will be packaged
vsce ls

# Show extension info
vsce show francisco.codebundle

# Package without publishing
vsce package

# Package with specific version
vsce package 0.1.0

# Publish with automatic version bump
vsce publish minor

# Verify package contents
unzip -l codebundle-0.0.1.vsix
```

## Resources

- [VS Code Publishing Docs](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce CLI Reference](https://github.com/microsoft/vscode-vsce)
- [Extension Manifest Reference](https://code.visualstudio.com/api/references/extension-manifest)
- [Marketplace Publisher Portal](https://marketplace.visualstudio.com/manage)
