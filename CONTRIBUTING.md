# Contributing

Thanks for taking an interest in MarkPress. This page is for people changing the plugin — users looking for how to publish notes should stay on the [README](./README.md).

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

Then enable the plugin in Obsidian.

## Docs for maintainers

| Doc | What it’s for |
| --- | --- |
| [docs/advanced.md](./docs/advanced.md) | Frontmatter overrides, X image base URL, command list |
| [docs/disclosures.md](./docs/disclosures.md) | Policy disclosures for Obsidian review |
| [SECURITY.md](./SECURITY.md) | Network / data access notes |
| [images/README.md](./images/README.md) | README screenshot naming and size |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |

## Pull requests

- Keep user-facing README simple; put shared contributor notes here or under `docs/`.
- Don’t commit vault data, `data.json`, secrets, or private screenshots.
- Match existing code style; run `npm run build` before opening a PR.

## License

By contributing, you agree your changes are released under the [MIT License](./LICENSE).
