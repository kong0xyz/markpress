# Publishing MarkPress to the Obsidian Community

Checklist aligned with the official docs:

- [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- [Submission requirements](https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins)
- [Developer policies](https://docs.obsidian.md/Developer+policies)
- [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)

## Prerequisites

1. **Public GitHub repository** (required by the Community directory).  
   This project may also live on GitLab for private work, but the submission `repo` field must be `owner/name` on **github.com**.
2. Root files present:
   - `README.md` (purpose, usage, **disclosures**)
   - `LICENSE` (MIT)
   - `manifest.json`
   - `versions.json`
   - source under `src/`
3. `manifest.json` rules:
   - `id`: `markpress` (lowercase, hyphens only; no `obsidian`; not ending in `plugin`)
   - `name`: `MarkPress` (no word “Plugin” / “Obsidian”)
   - `description`: ≤ 250 characters, ends with `.`, action-oriented
   - `version`: SemVer `x.y.z` (no `v` prefix)
   - `minAppVersion` set
   - omit `fundingUrl` unless you accept donations
   - `isDesktopOnly: false` (no Node/Electron-only APIs)

## Before first release

```bash
npm ci
npm run build
```

Confirm `main.js` and `styles.css` build cleanly. Do not commit secrets (`data.json` is gitignored).

Update if needed:

- `manifest.json` → `version`, `author`, `authorUrl` (your GitHub profile)
- `versions.json` → map `"<pluginVersion>": "<minAppVersion>"`
- `package.json` → same version (optional consistency)

## Create a GitHub Release

Tag **must match** `manifest.json` `version` exactly, **without** a `v` prefix:

```text
0.1.0   ✅
v0.1.0  ❌
```

Attach as **binary release assets**:

- `main.js`
- `manifest.json`
- `styles.css`

### Automated (recommended)

1. Push this repo to GitHub
2. Ensure `.github/workflows/release.yml` is present
3. Create and push a tag:

```bash
git tag 0.1.0
git push hub 0.1.0
```

4. Open the draft release created by the workflow, verify assets, then publish the release

### Manual

1. Run `npm run build`
2. GitHub → Releases → Draft a new release
3. Tag `0.1.0`, upload the three files, publish

## Submit to the Community directory

1. Open [community.obsidian.md](https://community.obsidian.md) (or open a PR against [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) as documented)
2. Add an entry equivalent to:

```json
{
  "id": "markpress",
  "name": "MarkPress",
  "author": "Kong",
  "description": "Format Markdown notes for WeChat public accounts and X Articles with live preview, themes, and one-click copy.",
  "repo": "kong0xyz/markpress"
}
```

3. `id` / `name` / `description` / `author` must match `manifest.json`
4. `repo` must be `owner/repo` of the **public GitHub** repository that contains the release assets

## Review expectations

Reviewers typically check:

- README disclosures (network, payments, telemetry, clipboard, vault access)
- No obfuscated code; source available
- No client-side telemetry / ads / self-update
- SemVer + matching release tag + assets
- Reasonable use of Obsidian APIs (`this.app`, not global `app`)

Initial review can take time. After approval, later versions ship via new GitHub releases without a new directory PR (as long as `id` stays the same).

## Post-approval version bumps

1. Bump `version` in `manifest.json`
2. Add entry to `versions.json`
3. Tag + release with the same version string
4. Users get the update through Obsidian’s plugin updater

## MarkPress-specific notes for reviewers

- **WeChat path**: local conversion only; Base64 images are embedded in clipboard HTML (not uploaded).
- **X Article path**: copies Markdown only; does not call the X API; local images need a public URL or manual upload in X.
- Default **no network**. Optional CDN prefix is user-configured string rewriting only.
