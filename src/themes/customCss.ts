import type { WeChatTheme } from "./types";
import { cloneTheme } from "./utils";

/**
 * Lightweight CSS → theme merger for known selectors.
 * Custom CSS is never emitted as a <style> block; it mutates theme values
 * that the renderer later turns into inline styles.
 */
export function applyCustomCss(theme: WeChatTheme, css: string): WeChatTheme {
  const next = cloneTheme(theme);
  const rules = parseSimpleCss(css);

  for (const rule of rules) {
    const decls = rule.declarations;
    for (const selector of rule.selectors) {
      applySelector(next, selector, decls);
    }
  }
  return next;
}

interface CssRule {
  selectors: string[];
  declarations: Record<string, string>;
}

function parseSimpleCss(css: string): CssRule[] {
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: CssRule[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(cleaned))) {
    const selectors = match[1]
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const declarations: Record<string, string> = {};
    for (const part of match[2].split(";")) {
      const idx = part.indexOf(":");
      if (idx < 0) continue;
      const key = part.slice(0, idx).trim().toLowerCase();
      const value = part.slice(idx + 1).trim();
      if (key && value) declarations[key] = value;
    }
    if (selectors.length && Object.keys(declarations).length) {
      rules.push({ selectors, declarations });
    }
  }
  return rules;
}

function applySelector(
  theme: WeChatTheme,
  selector: string,
  decls: Record<string, string>
): void {
  const s = selector.replace(/\.markpress-preview\s+/g, "").replace(/^\.article\s+/, "");

  if (s === "section" || s === ".article" || s === "body") {
    applyTypography(theme, decls);
    return;
  }
  if (s === "p") {
    if (decls["margin-top"]) theme.paragraph.marginTop = px(decls["margin-top"]);
    if (decls["margin-bottom"]) theme.paragraph.marginBottom = px(decls["margin-bottom"]);
    if (decls.color) theme.colors.text = decls.color;
    if (decls["font-size"]) theme.typography.fontSize = px(decls["font-size"]);
    if (decls["line-height"]) theme.typography.lineHeight = unitless(decls["line-height"]);
    return;
  }
  if (/^h[1-6]$/.test(s)) {
    const key = s as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    const heading = theme[key];
    if (decls["font-size"]) heading.fontSize = px(decls["font-size"]);
    if (decls["font-weight"]) heading.fontWeight = parseInt(decls["font-weight"], 10) || heading.fontWeight;
    if (decls.color) heading.color = decls.color;
    if (decls["text-align"]) heading.align = decls["text-align"] as typeof heading.align;
    if (decls["margin-top"]) heading.marginTop = px(decls["margin-top"]);
    if (decls["margin-bottom"]) heading.marginBottom = px(decls["margin-bottom"]);
    if (decls.padding) heading.padding = decls.padding;
    if (decls["border-radius"]) heading.borderRadius = px(decls["border-radius"]);
    if (decls.background || decls["background-color"]) {
      heading.background = decls.background || decls["background-color"];
    }
    if (decls["border-left"]) heading.borderLeft = decls["border-left"];
    if (decls["border-bottom"]) heading.borderBottom = decls["border-bottom"];
    return;
  }
  if (s === "blockquote") {
    if (decls.padding) theme.quote.padding = decls.padding;
    if (decls.background || decls["background-color"]) {
      theme.quote.background = decls.background || decls["background-color"] || theme.quote.background;
    }
    if (decls["border-left"]) theme.quote.borderLeft = decls["border-left"];
    if (decls.color) theme.quote.color = decls.color;
    if (decls["border-radius"]) theme.quote.borderRadius = px(decls["border-radius"]);
    return;
  }
  if (s === "pre" || s === "code" || s === "pre code") {
    if (decls.background || decls["background-color"]) {
      theme.code.background = decls.background || decls["background-color"] || theme.code.background;
    }
    if (decls.color) theme.code.color = decls.color;
    if (decls["font-size"]) theme.code.fontSize = px(decls["font-size"]);
    if (decls.padding) theme.code.padding = decls.padding;
    if (decls["border-radius"]) theme.code.borderRadius = px(decls["border-radius"]);
    if (decls["font-family"]) theme.code.fontFamily = decls["font-family"];
    return;
  }
  if (s === "a") {
    if (decls.color) theme.link.color = decls.color;
    if (decls["text-decoration"]) theme.link.textDecoration = decls["text-decoration"];
    return;
  }
  if (s === "img") {
    if (decls["border-radius"]) theme.image.borderRadius = px(decls["border-radius"]);
    if (decls["max-width"]) theme.image.maxWidth = decls["max-width"];
    return;
  }
  if (s === "hr") {
    if (decls["border-top"]) theme.divider.borderTop = decls["border-top"];
    if (decls.width) theme.divider.width = decls.width;
    return;
  }
  if (s === "table") {
    if (decls["font-size"]) theme.table.fontSize = px(decls["font-size"]);
    if (decls["border-color"]) theme.table.borderColor = decls["border-color"];
    return;
  }
}

function applyTypography(theme: WeChatTheme, decls: Record<string, string>): void {
  if (decls["font-family"]) theme.typography.fontFamily = decls["font-family"];
  if (decls["font-size"]) theme.typography.fontSize = px(decls["font-size"]);
  if (decls["line-height"]) theme.typography.lineHeight = unitless(decls["line-height"]);
  if (decls["letter-spacing"]) theme.typography.letterSpacing = px(decls["letter-spacing"]);
  if (decls.color) theme.colors.text = decls.color;
  if (decls["max-width"]) theme.layout.maxWidth = px(decls["max-width"]);
}

function px(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function unitless(value: string): number {
  if (value.endsWith("px")) {
    // approximate: 24px / 16 ≈ 1.5 when font-size unknown
    return px(value) / 16;
  }
  return parseFloat(value) || 1.75;
}
