import type { WeChatTheme } from "./types";
import { createHeading } from "./utils";
import { RECOMMENDED_FONT_SIZE, RECOMMENDED_LINE_HEIGHT } from "./typography";
import { getShadcnDarkPalette } from "./shadcn-dark";

/**
 * Fixed publish palettes (not Obsidian theme tokens).
 * Based on shadcn/ui color scales for cross-platform WeChat/output consistency.
 */
export interface ShadcnPalette {
  id: string;
  name: string;
  /** Accent used for links / emphasis */
  primary: string;
  foreground: string;
  foregroundMuted: string;
  heading: string;
  headingMuted: string;
  border: string;
  muted: string;
  mutedForeground: string;
  background: string;
  cardHeader: string;
  ring?: string;
}

/** Neutral families */
export const SHADCN_PALETTES: ShadcnPalette[] = [
  {
    id: "zinc",
    name: "Zinc",
    primary: "#18181b",
    foreground: "#09090b",
    foregroundMuted: "#3f3f46",
    heading: "#09090b",
    headingMuted: "#27272a",
    border: "#e4e4e7",
    muted: "#f4f4f5",
    mutedForeground: "#71717a",
    background: "#ffffff",
    cardHeader: "#fafafa",
  },
  {
    id: "slate",
    name: "Slate",
    primary: "#0f172a",
    foreground: "#020617",
    foregroundMuted: "#334155",
    heading: "#0f172a",
    headingMuted: "#1e293b",
    border: "#e2e8f0",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    background: "#ffffff",
    cardHeader: "#f8fafc",
  },
  {
    id: "stone",
    name: "Stone",
    primary: "#1c1917",
    foreground: "#0c0a09",
    foregroundMuted: "#44403c",
    heading: "#0c0a09",
    headingMuted: "#292524",
    border: "#e7e5e4",
    muted: "#f5f5f4",
    mutedForeground: "#78716c",
    background: "#ffffff",
    cardHeader: "#fafaf9",
  },
  {
    id: "gray",
    name: "Gray",
    primary: "#111827",
    foreground: "#030712",
    foregroundMuted: "#374151",
    heading: "#111827",
    headingMuted: "#1f2937",
    border: "#e5e7eb",
    muted: "#f3f4f6",
    mutedForeground: "#6b7280",
    background: "#ffffff",
    cardHeader: "#f9fafb",
  },
  {
    id: "neutral",
    name: "Neutral",
    primary: "#171717",
    foreground: "#0a0a0a",
    foregroundMuted: "#404040",
    heading: "#0a0a0a",
    headingMuted: "#262626",
    border: "#e5e5e5",
    muted: "#f5f5f5",
    mutedForeground: "#737373",
    background: "#ffffff",
    cardHeader: "#fafafa",
  },
  /** Accent families — primary for links/quote bar only; body text stays neutral. */
  {
    id: "blue",
    name: "Blue",
    primary: "#2563eb",
    foreground: "#18181b",
    foregroundMuted: "#3f3f46",
    heading: "#09090b",
    headingMuted: "#27272a",
    border: "#e4e4e7",
    muted: "#eff6ff",
    mutedForeground: "#71717a",
    background: "#ffffff",
    cardHeader: "#f8fafc",
    ring: "#3b82f6",
  },
  {
    id: "green",
    name: "Green",
    primary: "#16a34a",
    foreground: "#18181b",
    foregroundMuted: "#3f3f46",
    heading: "#09090b",
    headingMuted: "#27272a",
    border: "#e4e4e7",
    muted: "#f0fdf4",
    mutedForeground: "#71717a",
    background: "#ffffff",
    cardHeader: "#f7fee7",
    ring: "#22c55e",
  },
  {
    id: "violet",
    name: "Violet",
    primary: "#7c3aed",
    foreground: "#18181b",
    foregroundMuted: "#3f3f46",
    heading: "#09090b",
    headingMuted: "#27272a",
    border: "#e4e4e7",
    muted: "#f5f3ff",
    mutedForeground: "#71717a",
    background: "#ffffff",
    cardHeader: "#faf5ff",
    ring: "#8b5cf6",
  },
  {
    id: "orange",
    name: "Orange",
    primary: "#ea580c",
    foreground: "#18181b",
    foregroundMuted: "#3f3f46",
    heading: "#09090b",
    headingMuted: "#27272a",
    border: "#e4e4e7",
    muted: "#fff7ed",
    mutedForeground: "#71717a",
    background: "#ffffff",
    cardHeader: "#fffbeb",
    ring: "#f97316",
  },
  {
    id: "rose",
    name: "Rose",
    primary: "#e11d48",
    foreground: "#18181b",
    foregroundMuted: "#3f3f46",
    heading: "#09090b",
    headingMuted: "#27272a",
    border: "#e4e4e7",
    muted: "#fff1f2",
    mutedForeground: "#71717a",
    background: "#ffffff",
    cardHeader: "#fdf2f8",
    ring: "#f43f5e",
  },
  {
    id: "teal",
    name: "Teal",
    primary: "#0d9488",
    foreground: "#18181b",
    foregroundMuted: "#3f3f46",
    heading: "#09090b",
    headingMuted: "#27272a",
    border: "#e4e4e7",
    muted: "#f0fdfa",
    mutedForeground: "#71717a",
    background: "#ffffff",
    cardHeader: "#f0fdfa",
    ring: "#14b8a6",
  },
  {
    id: "red",
    name: "Red",
    primary: "#dc2626",
    foreground: "#18181b",
    foregroundMuted: "#3f3f46",
    heading: "#09090b",
    headingMuted: "#27272a",
    border: "#e4e4e7",
    muted: "#fef2f2",
    mutedForeground: "#71717a",
    background: "#ffffff",
    cardHeader: "#fef2f2",
    ring: "#ef4444",
  },
];

export function createShadcnTheme(palette: ShadcnPalette): WeChatTheme {
  const p = palette;
  const borderLine = `1px solid ${p.border}`;
  const dark = isDarkHex(p.background);
  // Code blocks need high contrast on both surfaces (Obsidian must not win).
  const codeBackground = dark ? p.cardHeader : p.muted;
  const codeColor = dark ? p.foreground : p.headingMuted;

  return {
    id: `shadcn-${p.id}`,
    name: `shadcn / ${p.name}`,
    colors: {
      primary: p.primary,
      text: p.foreground,
      secondaryText: p.mutedForeground,
      background: p.background,
      border: p.border,
      quoteBackground: "transparent",
      codeBackground: p.muted,
    },
    typography: {
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: RECOMMENDED_FONT_SIZE,
      lineHeight: RECOMMENDED_LINE_HEIGHT,
      letterSpacing: 0,
    },
    layout: {
      maxWidth: 680,
      contentPadding: "0",
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 20,
    },
    // Heading system: color fades h1 → h3; h2 is the section beat (center + primary).
    h1: createHeading({
      fontSize: 28,
      fontWeight: 800,
      color: p.heading,
      align: "left",
      marginTop: 8,
      marginBottom: 22,
      variant: "plain",
      decoration: "none",
    }),
    h2: createHeading({
      fontSize: 22,
      fontWeight: 700,
      color: p.primary,
      align: "center",
      marginTop: 48,
      marginBottom: 28,
      variant: "plain",
      decoration: "band",
    }),
    h3: createHeading({
      fontSize: 18,
      fontWeight: 600,
      color: p.foregroundMuted,
      align: "left",
      marginTop: 32,
      marginBottom: 14,
      variant: "plain",
      decoration: "prefix",
    }),
    h4: createHeading({
      fontSize: 16,
      fontWeight: 600,
      color: p.mutedForeground,
      marginTop: 24,
      marginBottom: 10,
      variant: "plain",
    }),
    h5: createHeading({
      fontSize: 15,
      fontWeight: 600,
      color: p.mutedForeground,
      marginTop: 20,
      marginBottom: 8,
      variant: "plain",
    }),
    h6: createHeading({
      fontSize: 14,
      fontWeight: 600,
      color: p.mutedForeground,
      marginTop: 18,
      marginBottom: 8,
      variant: "plain",
    }),
    quote: {
      padding: "0 0 0 16px",
      marginTop: 24,
      marginBottom: 24,
      background: "transparent",
      borderLeft: `2px solid ${p.primary}`,
      borderRadius: 0,
      color: p.mutedForeground,
      fontSize: RECOMMENDED_FONT_SIZE,
      fontStyle: "normal",
      lineHeight: RECOMMENDED_LINE_HEIGHT,
    },
    code: {
      background: codeBackground,
      color: codeColor,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 13,
      padding: "14px 16px",
      borderRadius: 8,
      marginTop: 20,
      marginBottom: 20,
      lineHeight: 1.65,
      whiteSpace: "pre-wrap",
      border: borderLine,
    },
    inlineCode: {
      background: p.muted,
      color: p.primary,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 13,
      padding: "2px 6px",
      borderRadius: 4,
      border: undefined,
    },
    list: {
      marginTop: 8,
      marginBottom: 20,
      paddingLeft: 24,
      itemSpacing: 6,
    },
    link: {
      color: p.primary,
      textDecoration: "underline",
    },
    image: {
      display: "block",
      maxWidth: "100%",
      marginTop: 24,
      marginBottom: 24,
      borderRadius: 8,
    },
    divider: {
      marginTop: 32,
      marginBottom: 32,
      borderTop: borderLine,
      width: "100%",
    },
    callout: {
      padding: "14px 16px",
      marginTop: 20,
      marginBottom: 20,
      borderRadius: 8,
      borderLeftWidth: 0,
      background: p.muted,
      titleWeight: 600,
      border: borderLine,
    },
    table: {
      fontSize: 14,
      borderColor: p.border,
      headerBackground: p.cardHeader,
      headerColor: p.heading,
      cellPadding: "10px 14px",
      marginTop: 24,
      marginBottom: 24,
      variant: "card",
      borderRadius: 8,
      textColor: p.foregroundMuted,
    },
  };
}

export const shadcnThemes: WeChatTheme[] = SHADCN_PALETTES.map(createShadcnTheme);

function isDarkHex(hex: string): boolean {
  const cleaned = hex.replace("#", "").trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return false;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

/** Resolve shadcn-* theme for light or dark surface. */
export function resolveShadcnTheme(
  themeId: string,
  colorScheme: "light" | "dark"
): WeChatTheme | undefined {
  const match = /^shadcn-(.+)$/.exec(themeId);
  if (!match) return undefined;
  const colorId = match[1];
  if (colorScheme === "dark") {
    const dark = getShadcnDarkPalette(colorId);
    if (dark) return createShadcnTheme(dark);
  }
  const light = SHADCN_PALETTES.find((p) => p.id === colorId);
  return light ? createShadcnTheme(light) : undefined;
}

/** @deprecated use shadcn-zinc — kept for old settings */
export const shadcnTheme: WeChatTheme = {
  ...createShadcnTheme(SHADCN_PALETTES[0]),
  id: "shadcn",
  name: "shadcn / Zinc",
};
