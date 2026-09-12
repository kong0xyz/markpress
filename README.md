# MarkPress

Write in Obsidian. Preview how it will look. Copy once — paste into **WeChat** or **X Articles**.

[中文说明](./README.zh.md)

## What it does

MarkPress turns your Markdown note into publish-ready content:

| Platform | What you get |
| --- | --- |
| **WeChat** | Styled article you can paste into the WeChat public-account editor |
| **X Article** | Clean Markdown you can paste into the X Articles editor |

Everything runs on your computer. No account. No upload service required.

![WeChat preview](./images/preview-wechat.png)

![X Article preview](./images/preview-x.png)

## Quick start

1. Install and enable **MarkPress** (Community plugins → Browse → MarkPress).
2. Open a Markdown note.
3. Click the MarkPress icon (left ribbon or status bar), or run **MarkPress: Preview Current Note** from the command palette.

You will see a live preview. Choose **WeChat** or **X Article** at the top, then copy.

Optional: bind your own shortcuts under **Settings → Hotkeys** (search “MarkPress”). No defaults are set, so nothing conflicts with other plugins.

## Publish to WeChat

1. Select **WeChat** in the preview toolbar.
2. Pick a theme and Light / Dark if you like.
3. Click **Copy for WeChat**.
4. Open the WeChat public-account editor and paste (`Cmd/Ctrl+V`).

Images in your note are included automatically when you copy.

**Tip:** Light mode usually looks closer to what readers see on WeChat.

## Publish to X Articles

1. Select **X Article** in the preview toolbar.
2. Click **Copy Markdown**.
3. Paste into the X Articles editor.

**About images on X:** X does not accept embedded image files from Obsidian the same way WeChat does. Online image links (`https://...`) work as-is. For pictures stored only in your vault, upload them inside X after pasting, or set an image host URL in MarkPress settings if you already publish images to the web.

## Good to know

- Works with headings, bold, lists, quotes, tables, code blocks, and Obsidian callouts.
- Wiki images like `![[photo.png]]` are supported.
- You can change the default platform and themes under **Settings → MarkPress**.

## Privacy

MarkPress works offline. It does not send your notes to any server. Copy only uses your clipboard when you click Copy.

## Contribute

Want to report a bug, improve the plugin, or help with releases? See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) · Author: [Kong](https://github.com/kong0xyz)
