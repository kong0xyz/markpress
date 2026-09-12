# Security

MarkPress follows [Obsidian Developer policies](https://docs.obsidian.md/Developer+policies).

## Network Activity

None by default.

| Host | Purpose | Data Sent | Direction |
| --- | --- | --- | --- |
| — | No outbound requests | — | — |

Optional **X image base URL** only rewrites Markdown image destinations to a URL you provide. The plugin does not upload vault files to that host.

## Data Access

- Reads the active Markdown note and linked vault images through the Obsidian Vault / MetadataCache APIs.
- Does not access files outside the vault.
- Does not use Node `fs`, shell, or Electron privileged APIs for file IO.

## Privileged APIs

- **Clipboard**: writes WeChat rich HTML or X Markdown on user-initiated Copy.
- **Canvas / ImageBitmap** (optional): local image compression before WeChat Base64 embed. Processing stays on-device.

## Telemetry & Ads

None.

## Privacy

All conversion runs locally in Obsidian. Copied content stays on the clipboard until you paste it into another app (WeChat editor, X Articles, etc.).

## Reporting issues

Open a GitHub Issue at [kong0xyz/markpress](https://github.com/kong0xyz/markpress/issues). Do not include vault secrets or private notes in bug reports.
