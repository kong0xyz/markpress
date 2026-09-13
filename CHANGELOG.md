# Changelog

All notable changes to MarkPress are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/). Versioning follows [SemVer](https://semver.org/).

Obsidian users mainly see updates via **GitHub Releases**; this file is the readable history in the repo. Do **not** put a long changelog in the README.

## [0.1.2] — 2026-09-13

### Fixed

- Drop dynamic `<style>` in preview Shadow DOM (CSS only via `styles.css` / inline styles)
- Settings: no plugin-name heading; remove `setDestructive` (requires Obsidian 1.13+)
- Frontmatter parser typing / nested-indent regex clarity

## [0.1.1] — 2026-09-13

### Fixed

- Obsidian Community Plugin review findings: remove gray-matter (fs/eval), clipboard DOM/`innerHTML` fallbacks, default hotkeys, and leaf detach on unload
- Preview Shadow DOM mounts without `innerHTML`; settings headings use `Setting.setHeading()`
- Raise `minAppVersion` to `1.7.2` for `revealLeaf`; release workflow builds via `npm ci` with artifact attestations

## [0.1.0] — 2026-09-13

### Added

- WeChat publish path: themed preview and rich-text copy (inline CSS)
- X Article path: structure preview and native Markdown copy
- Built-in themes (including shadcn palettes), Light / Dark for WeChat
- Support for callouts, tables, code blocks, and wiki images `![[...]]`
- Optional X image base URL for rewriting local image paths in Markdown

[0.1.2]: https://github.com/kong0xyz/markpress/releases/tag/0.1.2
[0.1.1]: https://github.com/kong0xyz/markpress/releases/tag/0.1.1
[0.1.0]: https://github.com/kong0xyz/markpress/releases/tag/0.1.0
