import type { DocumentWeChatOverrides } from "../ast/types";
import { chineseTheme } from "./chinese";
import { defaultTheme } from "./default";
import { elegantTheme } from "./elegant";
import { fumadocsTheme } from "./fumadocs";
import { minimalTheme } from "./minimal";
import { shadcnThemes, resolveShadcnTheme } from "./shadcn";
import { techTheme } from "./tech";
import type { ThemeOverrides, WeChatTheme } from "./types";
import { applyHeadingVariant, cloneTheme } from "./utils";
import { applyCustomCss } from "./customCss";

export const BUILTIN_THEMES: WeChatTheme[] = [
  ...shadcnThemes,
  fumadocsTheme,
  defaultTheme,
  minimalTheme,
  elegantTheme,
  techTheme,
  chineseTheme,
];

const themeMap = new Map(BUILTIN_THEMES.map((t) => [t.id, t]));

export function getBuiltinTheme(id: string): WeChatTheme | undefined {
  return themeMap.get(id);
}

export function listBuiltinThemes(): WeChatTheme[] {
  return BUILTIN_THEMES.slice();
}

export function applyOverrides(theme: WeChatTheme, overrides?: ThemeOverrides): WeChatTheme {
  const next = cloneTheme(theme);
  if (!overrides) return finalizeVariants(next);

  if (overrides.primaryColor) {
    next.colors.primary = overrides.primaryColor;
    next.link.color = overrides.linkColor || overrides.primaryColor;
    next.quote.borderLeft = `2px solid ${overrides.primaryColor}`;
    next.h2.color = overrides.primaryColor;
  }
  if (overrides.textColor) next.colors.text = overrides.textColor;
  if (overrides.secondaryTextColor) next.colors.secondaryText = overrides.secondaryTextColor;
  if (overrides.fontFamily) next.typography.fontFamily = overrides.fontFamily;
  if (overrides.fontSize != null) next.typography.fontSize = overrides.fontSize;
  if (overrides.lineHeight != null) next.typography.lineHeight = overrides.lineHeight;
  if (overrides.letterSpacing != null) next.typography.letterSpacing = overrides.letterSpacing;
  if (overrides.paragraphMarginTop != null) next.paragraph.marginTop = overrides.paragraphMarginTop;
  if (overrides.paragraphMarginBottom != null) {
    next.paragraph.marginBottom = overrides.paragraphMarginBottom;
  }
  if (overrides.maxWidth != null) next.layout.maxWidth = overrides.maxWidth;
  if (overrides.quoteBackground) {
    next.colors.quoteBackground = overrides.quoteBackground;
    next.quote.background = overrides.quoteBackground;
  }
  if (overrides.codeBackground) {
    next.colors.codeBackground = overrides.codeBackground;
    next.code.background = overrides.codeBackground;
  }
  if (overrides.linkColor) next.link.color = overrides.linkColor;
  if (overrides.imageBorderRadius != null) next.image.borderRadius = overrides.imageBorderRadius;
  if (overrides.dividerBorder) next.divider.borderTop = overrides.dividerBorder;
  if (overrides.h1Variant) next.h1.variant = overrides.h1Variant;
  if (overrides.h2Variant) next.h2.variant = overrides.h2Variant;
  if (overrides.h3Variant) next.h3.variant = overrides.h3Variant;

  return finalizeVariants(next);
}

function finalizeVariants(theme: WeChatTheme): WeChatTheme {
  theme.h1 = applyHeadingVariant(theme.h1, theme.colors.primary);
  theme.h2 = applyHeadingVariant(theme.h2, theme.colors.primary);
  theme.h3 = applyHeadingVariant(theme.h3, theme.colors.primary);
  theme.h4 = applyHeadingVariant(theme.h4, theme.colors.primary);
  theme.h5 = applyHeadingVariant(theme.h5, theme.colors.primary);
  theme.h6 = applyHeadingVariant(theme.h6, theme.colors.primary);
  return theme;
}

export function applyDocumentOverrides(
  theme: WeChatTheme,
  doc?: DocumentWeChatOverrides
): WeChatTheme {
  if (!doc) return theme;
  return applyOverrides(theme, {
    primaryColor: doc.primaryColor,
    fontSize: doc.fontSize,
    lineHeight: doc.lineHeight,
    letterSpacing: doc.letterSpacing,
    paragraphMarginBottom: doc.paragraphSpacing,
    maxWidth: doc.maxWidth,
  });
}

/**
 * Resolve final theme:
 * Document Frontmatter > Theme overrides > Global settings > Builtin default
 *
 * colorScheme switches shadcn palettes between light/dark surfaces.
 * Non-shadcn themes currently stay light (publish-oriented) unless overridden by Custom CSS.
 */
export function resolveTheme(options: {
  themeId: string;
  globalOverrides?: ThemeOverrides;
  customCss?: string;
  documentOverrides?: DocumentWeChatOverrides;
  colorScheme?: "light" | "dark";
}): WeChatTheme {
  const baseId = normalizeThemeId(
    options.documentOverrides?.theme || options.themeId || "shadcn-zinc"
  );
  const scheme = options.colorScheme || "light";
  const shadcn = resolveShadcnTheme(baseId, scheme);
  const base = cloneTheme(shadcn || getBuiltinTheme(baseId) || defaultTheme);
  let theme = applyOverrides(base, options.globalOverrides);
  theme = applyDocumentOverrides(theme, options.documentOverrides);
  if (options.customCss?.trim()) {
    theme = applyCustomCss(theme, options.customCss);
  }
  return theme;
}

function normalizeThemeId(id: string): string {
  if (id === "shadcn") return "shadcn-zinc";
  return id;
}

export type { WeChatTheme, ThemeOverrides, SavedTheme } from "./types";
