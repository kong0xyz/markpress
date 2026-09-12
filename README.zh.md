# MarkPress

把 Obsidian 里的 Markdown 笔记，排成适合发布的格式：

- **微信公众号**：主题渲染 + 带格式复制（Inline CSS）
- **X Article**：结构预览 + 复制原生 Markdown

[English README](./README.md)

## 功能

- **微信**：主题渲染 → 内联 CSS 富文本 → 复制 `text/html` + `text/plain`（粘贴到公众号后台）
- **X Article**：结构预览 → 复制原生 Markdown（粘贴到 X Articles 编辑器）
- 内置主题（shadcn 色板等），微信支持 Light / Dark
- 支持 Callout、表格、代码块、Wiki 图片 `![[...]]`
- 微信复制：本地图片嵌入 Base64（可选压缩）
- X Markdown：保留远程 `https://` 图片；可选配置 **X image base URL**，把库内图片改写成 CDN 地址

## 披露说明（Disclosures）

遵循 [Obsidian Developer policies](https://docs.obsidian.md/Developer+policies)：

| 项目 | 说明 |
| --- | --- |
| 付费 / 账号 | **无** |
| 网络请求 | **默认无**。插件不调用远程 API。设置项 **X image base URL** 仅把 Markdown 图片路径改写成你配置的 URL，不会上传文件。 |
| 遥测 | **无** |
| 广告 | **无** |
| 访问库外文件 | **无**。只通过 Obsidian API 读取当前库内的笔记与图片。 |
| 剪贴板 | **会使用**。复制时写入系统剪贴板（微信富文本 / X 纯 Markdown）。 |
| 闭源 | **否**。完整源码在本仓库（MIT）。 |

## 安装（上架社区插件后）

1. **设置 → 第三方插件 → 浏览**
2. 搜索 **MarkPress**
3. 安装并启用

### 手动 / 测试安装

1. 构建：`npm install && npm run build`
2. 将 `main.js`、`manifest.json`、`styles.css` 放到：

```text
<Vault>/.obsidian/plugins/markpress/
```

3. 在第三方插件中启用 **MarkPress**

## 用法

1. 打开一篇 Markdown 笔记
2. 打开 MarkPress 预览（左侧图标、状态栏，或命令 **Preview Current Note** / `Mod+Shift+M`）
3. 工具栏选择平台：**WeChat** 或 **X Article**
4. **微信**：选主题 + Light/Dark → **Copy for WeChat** → 粘贴到公众号后台
5. **X Article**：**Copy Markdown** → 粘贴到 X Articles 编辑器

快捷键 **按当前平台复制**：`Mod+Shift+C`

### 微信 Frontmatter 覆盖

```yaml
---
title: 示例
wechat:
  theme: shadcn-zinc
  primaryColor: "#2563eb"
  fontSize: 16
  lineHeight: 1.75
---
```

优先级：文档 `wechat:` → 设置覆盖 → 内置主题。

### X 图片（Obsidian → X）

X Articles **不支持** Base64 / `data:` 图片。本地图需要公网 URL，或在 X 里手动上传。

- 已有 `https://...`：复制 Markdown 时原样保留
- 本地 / Wiki 图：默认写成库内相对路径；若在设置中配置 **X image base URL**（CDN 前缀），会拼成公网地址，例如 `https://cdn.example.com/vault` → `https://cdn.example.com/vault/attachments/a.png`

## 命令

| 命令 | 说明 |
| --- | --- |
| Preview Current Note | 打开预览并渲染当前笔记 |
| Open Preview | 打开预览面板 |
| Copy for Current Platform | 按当前平台复制（微信富文本 / X Markdown） |
| Copy (WeChat rich text / X Markdown) | 同上 |

## 开发

```bash
npm install
npm run build   # 生产构建 main.js
npm run dev     # 监听构建
```

上架社区插件的步骤见 [PUBLISHING.md](./PUBLISHING.md)。

## 许可

[MIT](./LICENSE) · 作者：[Kong](https://github.com/kong0xyz)
