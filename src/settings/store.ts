import type { HeadingVariant, SavedTheme, ThemeOverrides } from "../themes/types";
import { RECOMMENDED_LINE_HEIGHT } from "../themes/typography";

/** Publish target platform — each has its own render + copy path. */
export type PublishPlatform = "wechat" | "x";

/** MarkPress article surface — independent of Obsidian light/dark. */
export type ArticleColorMode = "light" | "dark";

export interface MarkPressSettings {
  /** Active publish platform (preview + copy). */
  platform: PublishPlatform;
  themeId: string;
  overrides: ThemeOverrides;
  customCss: string;
  savedThemes: SavedTheme[];
  optimizeImages: boolean;
  imageMaxWidth: number;
  jpegQuality: number;
  previewDebounceMs: number;
  /**
   * Light/Dark for WeChat preview and copy (same HTML).
   * Prefer light when publishing to WeChat.
   */
  colorMode: ArticleColorMode;
  /**
   * Optional public base URL for vault images when copying Markdown for X.
   * Example: `https://cdn.example.com/my-vault`
   * Local `attachments/a.png` → `https://cdn.example.com/my-vault/attachments/a.png`
   * Leave empty to keep vault-relative paths (X cannot load those — you'll get a notice).
   */
  xImageBaseUrl: string;
}

export const DEFAULT_SETTINGS: MarkPressSettings = {
  platform: "wechat",
  themeId: "shadcn-zinc",
  overrides: {
    lineHeight: RECOMMENDED_LINE_HEIGHT,
  },
  customCss: "",
  savedThemes: [],
  optimizeImages: true,
  imageMaxWidth: 1080,
  jpegQuality: 0.85,
  previewDebounceMs: 300,
  colorMode: "light",
  xImageBaseUrl: "",
};

export const HEADING_VARIANTS: { id: HeadingVariant; label: string }[] = [
  { id: "plain", label: "Plain" },
  { id: "left-border", label: "Left Border" },
  { id: "bottom-border", label: "Bottom Border" },
  { id: "background", label: "Background" },
];

export const PUBLISH_PLATFORMS: { id: PublishPlatform; label: string }[] = [
  { id: "wechat", label: "WeChat" },
  { id: "x", label: "X Article" },
];
