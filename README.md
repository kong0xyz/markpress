# MarkPress

Format Markdown notes for **WeChat public accounts** and **X Articles**: live preview, theme engine, and one-click copy.

[中文文档](./README.zh.md)

## Features

- **WeChat**: theme rendering → inline-CSS rich text → copy `text/html` + `text/plain` (paste into the WeChat editor)
- **X Article**: structure preview → copy native Markdown (paste into the X Articles editor)
- Built-in themes (shadcn palettes + extras), Light/Dark for WeChat
- Obsidian Callouts, tables, code blocks, wiki images `![[...]]`
- WeChat copy embeds local images as Base64 (optional compression)
- X Markdown keeps remote `https://` image URLs; optional **X image base URL** for vault images on a CDN

## Disclosures

Required by [Obsidian Developer policies](https://docs.obsidian.md/Developer+policies):

| Topic | Status |
| --- | --- |
| Payment / account required | **No** |
| Network use | **No** outbound network calls by default. The plugin does not call remote APIs. Optional setting **X image base URL** only rewrites Markdown image paths to a URL you configure; it does not upload files. |
| Telemetry | **None** (no client-side or server-side telemetry) |
| Ads | **None** |
| Files outside the vault | **No**. Reads only notes and images inside the current vault via the Obsidian API. |
| Clipboard | **Yes**. Copy writes to the system clipboard (rich HTML for WeChat, plain Markdown for X). |
| Closed source | **No**. Full source is in this repository (MIT). |

## Install (after community listing)

1. Open **Settings → Community plugins → Browse**
2. Search for **MarkPress**
3. Install and enable

### Manual / beta install

1. Build: `npm install && npm run build`
2. Copy `main.js`, `manifest.json`, and `styles.css` into:

```text
<Vault>/.obsidian/plugins/markpress/
```

3. Enable **MarkPress** under Community plugins

## Usage

1. Open a Markdown note
2. Open MarkPress preview (ribbon, status bar, or command **Preview Current Note** / `Mod+Shift+M`)
3. Choose platform in the toolbar: **WeChat** or **X Article**
4. **WeChat**: pick theme + Light/Dark → **Copy for WeChat** → paste into the WeChat public-account editor
5. **X Article**: **Copy Markdown** → paste into the X Articles editor

Hotkey **Copy for Current Platform**: `Mod+Shift+C`

### WeChat frontmatter overrides

```yaml
---
title: Example
wechat:
  theme: shadcn-zinc
  primaryColor: "#2563eb"
  fontSize: 16
  lineHeight: 1.75
---
```

Priority: document `wechat:` → settings overrides → builtin theme.

### X images (Obsidian → X)

X Articles **do not** accept Base64 / `data:` images. Local vault images must become public URLs or be uploaded inside X.

- Remote `https://...` links are kept as-is in copied Markdown
- Local / wiki images become vault-relative paths unless you set **X image base URL** in settings (CDN prefix), e.g. `https://cdn.example.com/vault` → `https://cdn.example.com/vault/attachments/a.png`

## Commands

| Command | Description |
| --- | --- |
| Preview Current Note | Open preview and render the active note |
| Open Preview | Open the preview leaf |
| Copy for Current Platform | Copy WeChat rich text or X Markdown |
| Copy (WeChat rich text / X Markdown) | Same as above |

## Development

```bash
npm install
npm run build   # production main.js
npm run dev     # watch build
```

See [PUBLISHING.md](./PUBLISHING.md) for Obsidian Community Plugin release steps.

## License

[MIT](./LICENSE) · Author: [Kong](https://github.com/kong0xyz)
