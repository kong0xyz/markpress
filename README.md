# MarkPress

Obsidian 插件：将当前 Markdown 笔记转换为适合微信公众号后台粘贴的富文本（Inline CSS）。

## 核心流程

```text
Obsidian 编辑 Markdown
  → WeChat Preview（实时预览）
  → 选择 / 调整主题
  → Copy for WeChat
  → 公众号后台 Cmd/Ctrl + V
```

## 功能（MVP）

- Markdown → AST → WeChat Renderer → Inline CSS HTML
- 内置主题：Default / Minimal / Elegant / Tech / Chinese
- Settings 可视化样式 + Advanced Custom CSS（计算进 inline style）
- Frontmatter `wechat:` 覆盖
- Callout / 表格 / 代码块 / Wiki 图片
- 预览：本地图片 Blob URL
- 复制：本地图片 Base64（可压缩）
- 剪贴板：`text/html` + `text/plain`

## 开发

```bash
npm install
npm run build
```

将本目录（或 `main.js` + `manifest.json` + `styles.css`）链接到：

```text
<Vault>/.obsidian/plugins/markpress/
```

然后在 Obsidian 中启用 **MarkPress**。

## 命令

| Command | 说明 |
|---|---|
| WeChat: Preview Current Note | 打开预览并渲染当前笔记 |
| WeChat: Open Preview | 打开预览面板 |
| WeChat: Copy Current Note | 不打开预览直接复制 |
| WeChat: Copy as Rich Text | 同上 |

## Frontmatter 示例

```yaml
---
title: Markdown 写作指南
wechat:
  theme: minimal
  primaryColor: "#625fff"
  fontSize: 16
  lineHeight: 1.8
---
```

优先级：Document Frontmatter → Theme overrides → Global Settings → Builtin Default
