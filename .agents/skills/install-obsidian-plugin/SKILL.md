---
name: install-obsidian-plugin
description: Build and install this repo's Obsidian Recall plugin into Uygar's iCloud Obsidian vault. Use when the user asks to reload, reinstall, install, deploy, or verify the Obsidian plugin from main or another branch, especially when Codex lacks Full Disk Access and must give the user copy-paste Terminal commands.
---

# Install Obsidian Plugin

Use this workflow for `/Users/uygar/Developer/obsidian-recall`.

## Workflow

1. Confirm the requested branch. If the user does not name a branch, use the current branch.
2. Check `git status --short --branch` and avoid disturbing unrelated untracked files.
3. Switch to the requested branch when needed.
4. Run `npm run build` from the repo.
5. Confirm these build artifacts exist:
   - `/private/tmp/obsidian-recall-build/main.js`
   - `/private/tmp/obsidian-recall-build/manifest.json`
   - `/private/tmp/obsidian-recall-build/styles.css`
6. Give the user one copy-paste Terminal command that installs and verifies the build. Explain that the Terminal app needs Full Disk Access if macOS returns `Operation not permitted`.
7. Ask the user to paste the command output.
8. Verify collaboratively:
   - If the build and installed hashes match for all three files, say the correct version is installed on disk.
   - If any hash differs, tell the user which file did not install correctly and rerun the install command.
   - Do not claim the installed plugin is verified unless the installed hashes are available from Codex or from the user's pasted output.
9. Tell the user to reload Obsidian by toggling the plugin off and on.

## User Terminal Command

After a successful build, provide this command exactly, unless the repo or vault path has changed:

```bash
cd "/Users/uygar/Developer/obsidian-recall"

VAULT="/Users/uygar/Library/Mobile Documents/iCloud~md~obsidian/Documents/Uygar's Vault"
PLUGIN_DIR="$VAULT/.obsidian/plugins/obsidian-recall"
BUILD_DIR="/private/tmp/obsidian-recall-build"

mkdir -p "$PLUGIN_DIR"

cp "$BUILD_DIR/main.js" "$PLUGIN_DIR/main.js"
cp "$BUILD_DIR/manifest.json" "$PLUGIN_DIR/manifest.json"
cp "$BUILD_DIR/styles.css" "$PLUGIN_DIR/styles.css"

echo "Repo branch:"
git branch --show-current

echo
echo "Build vs installed hashes:"
shasum -a 256 "$BUILD_DIR/main.js" "$PLUGIN_DIR/main.js"
shasum -a 256 "$BUILD_DIR/manifest.json" "$PLUGIN_DIR/manifest.json"
shasum -a 256 "$BUILD_DIR/styles.css" "$PLUGIN_DIR/styles.css"
```

## Verification Rules

For each file, the two adjacent hashes must be identical:

- `main.js`: first pair
- `manifest.json`: second pair
- `styles.css`: third pair

When all three pairs match, the build artifacts were copied correctly. This verifies the on-disk plugin files, not whether Obsidian has already reloaded them in memory.
