import type { WeChatTheme } from "../themes/types";

export type StyleMap = Record<string, string | number | undefined | null | false>;

/**
 * Plain inline styles only — no !important.
 * Preview isolation is done via Shadow DOM, so we do not fight Obsidian with !important.
 * The same HTML is used for Copy → WeChat.
 */
export function styleAttr(styles: StyleMap): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === null || value === false || value === "") continue;
    parts.push(`${kebab(key)}:${formatValue(key, value)}`);
  }
  return parts.length ? ` style="${parts.join(";")}"` : "";
}

function kebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function formatValue(key: string, value: string | number): string {
  if (typeof value === "number") {
    if (
      key === "fontWeight" ||
      key === "lineHeight" ||
      key === "opacity" ||
      key === "zIndex" ||
      key === "flex" ||
      key === "order"
    ) {
      return String(value);
    }
    return `${value}px`;
  }
  return String(value);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Shared article wrapper for Preview + Copy (identical). */
export function articleShell(theme: WeChatTheme, inner: string): string {
  const style = styleAttr({
    maxWidth: theme.layout.maxWidth,
    margin: "0 auto",
    padding: theme.layout.contentPadding || "0",
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize,
    lineHeight: theme.typography.lineHeight,
    letterSpacing: theme.typography.letterSpacing,
    color: theme.colors.text,
    // Soft page fill so Shadow host / WeChat both have a defined canvas.
    background: theme.colors.background,
    wordWrap: "break-word",
    textAlign: "left",
  });
  return `<section${style}>${inner}</section>`;
}
