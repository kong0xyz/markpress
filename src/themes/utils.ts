import type { HeadingStyle, WeChatTheme } from "./types";

export function createHeading(
  partial: Partial<HeadingStyle> & Pick<HeadingStyle, "fontSize" | "fontWeight" | "color">
): HeadingStyle {
  return {
    align: "left",
    marginTop: 28,
    marginBottom: 14,
    padding: "0",
    borderRadius: 0,
    variant: "plain",
    decoration: "none",
    ...partial,
  };
}

export function applyHeadingVariant(heading: HeadingStyle, primary: string): HeadingStyle {
  const next = { ...heading };
  switch (heading.variant) {
    case "left-border":
      next.borderLeft = next.borderLeft || `4px solid ${primary}`;
      next.padding = next.padding === "0" ? "0 0 0 12px" : next.padding;
      break;
    case "bottom-border":
      next.borderBottom = next.borderBottom || `2px solid ${primary}`;
      next.padding = next.padding === "0" ? "0 0 8px" : next.padding;
      break;
    case "background":
      next.background = next.background || hexToRgba(primary, 0.08);
      next.padding = next.padding === "0" ? "8px 12px" : next.padding;
      next.borderRadius = next.borderRadius || 6;
      break;
    default:
      break;
  }
  return next;
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return `rgba(0,0,0,${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function cloneTheme(theme: WeChatTheme): WeChatTheme {
  return JSON.parse(JSON.stringify(theme)) as WeChatTheme;
}
