import type { HeadingVariant, SavedTheme, ThemeOverrides } from "../themes/types";
import { RECOMMENDED_LINE_HEIGHT } from "../themes/typography";

/** MarkPress article surface — independent of Obsidian light/dark. */
export type ArticleColorMode = "light" | "dark";

export interface MarkPressSettings {
  themeId: string;
  overrides: ThemeOverrides;
  customCss: string;
  savedThemes: SavedTheme[];
  optimizeImages: boolean;
  imageMaxWidth: number;
  jpegQuality: number;
  previewDebounceMs: number;
  /**
   * Light/Dark for BOTH preview and copy (same HTML).
   * Prefer light when publishing to WeChat.
   */
  colorMode: ArticleColorMode;
}

export const DEFAULT_SETTINGS: MarkPressSettings = {
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
};

export const HEADING_VARIANTS: { id: HeadingVariant; label: string }[] = [
  { id: "plain", label: "Plain" },
  { id: "left-border", label: "Left Border" },
  { id: "bottom-border", label: "Bottom Border" },
  { id: "background", label: "Background" },
];
