# Advanced options

For everyday use, start with the [README](../README.md). This page covers optional power-user settings and development.

## Per-note WeChat overrides

Add a `wechat:` block in the note frontmatter:

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

Priority: document `wechat:` → Settings overrides → builtin theme.

## X image base URL

X Articles do not accept Base64 / `data:` images.

In **Settings → MarkPress → X image base URL**, you can set a public CDN prefix. Local vault paths are rewritten when copying Markdown, for example:

```text
Base:  https://cdn.example.com/vault
File:  attachments/a.png
Result: https://cdn.example.com/vault/attachments/a.png
```

If empty, local images stay as vault-relative paths (X cannot load them until you upload or host them).

Remote `https://...` image links are always kept as-is.

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

Copy `main.js`, `manifest.json`, and `styles.css` into:

```text
<Vault>/.obsidian/plugins/markpress/
```
