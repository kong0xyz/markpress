export type HeadingVariant = "plain" | "left-border" | "bottom-border" | "background";

/** Lightweight SVG ornaments for headings (WeChat-safe: no id / script / external CSS). */
export type HeadingDecoration = "none" | "band" | "prefix";

export interface HeadingStyle {
  fontSize: number;
  fontWeight: number;
  color: string;
  align: "left" | "center" | "right";
  marginTop: number;
  marginBottom: number;
  padding: string;
  borderRadius: number;
  background?: string;
  borderLeft?: string;
  borderBottom?: string;
  variant: HeadingVariant;
  /** Optional SVG accent around the title text. */
  decoration?: HeadingDecoration;
}

export interface QuoteStyle {
  padding: string;
  marginTop: number;
  marginBottom: number;
  background: string;
  borderLeft: string;
  borderRadius: number;
  color: string;
  fontSize?: number;
  /** shadcn/fumadocs-style muted italic quotes */
  fontStyle?: "normal" | "italic";
  lineHeight?: number;
}

export interface CodeStyle {
  background: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  padding: string;
  borderRadius: number;
  marginTop: number;
  marginBottom: number;
  lineHeight: number;
  whiteSpace: "pre-wrap" | "pre" | "normal";
  border?: string;
}

export interface InlineCodeStyle {
  background: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  padding: string;
  borderRadius: number;
  border?: string;
}

export interface ListStyle {
  marginTop: number;
  marginBottom: number;
  paddingLeft: number;
  itemSpacing: number;
}

export interface LinkStyle {
  color: string;
  textDecoration: string;
}

export interface ImageStyle {
  display: string;
  maxWidth: string;
  marginTop: number;
  marginBottom: number;
  borderRadius: number;
}

export interface DividerStyle {
  marginTop: number;
  marginBottom: number;
  borderTop: string;
  width: string;
}

export interface CalloutStyle {
  padding: string;
  marginTop: number;
  marginBottom: number;
  borderRadius: number;
  borderLeftWidth: number;
  background: string;
  titleWeight: number;
  border?: string;
}

/**
 * Table layout inspired by shadcn / fumadocs prose tables.
 * - grid: full cell borders
 * - lined: horizontal rules only (docs style)
 * - card: rounded bordered wrapper, horizontal lines
 */
export type TableVariant = "grid" | "lined" | "card";

export interface TableStyle {
  fontSize: number;
  borderColor: string;
  headerBackground: string;
  headerColor?: string;
  cellPadding: string;
  marginTop: number;
  marginBottom: number;
  variant?: TableVariant;
  borderRadius?: number;
  stripedBackground?: string;
  textColor?: string;
}

export interface WeChatTheme {
  id: string;
  name: string;

  colors: {
    primary: string;
    text: string;
    secondaryText: string;
    background: string;
    border: string;
    quoteBackground: string;
    codeBackground: string;
  };

  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
  };

  layout: {
    maxWidth: number;
    contentPadding: string;
  };

  paragraph: {
    marginTop: number;
    marginBottom: number;
  };

  h1: HeadingStyle;
  h2: HeadingStyle;
  h3: HeadingStyle;
  h4: HeadingStyle;
  h5: HeadingStyle;
  h6: HeadingStyle;

  quote: QuoteStyle;
  code: CodeStyle;
  inlineCode: InlineCodeStyle;
  list: ListStyle;
  link: LinkStyle;
  image: ImageStyle;
  divider: DividerStyle;
  callout: CalloutStyle;
  table: TableStyle;
}

/** User-editable overrides stored in plugin settings. */
export interface ThemeOverrides {
  primaryColor?: string;
  textColor?: string;
  secondaryTextColor?: string;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  paragraphMarginTop?: number;
  paragraphMarginBottom?: number;
  maxWidth?: number;
  quoteBackground?: string;
  codeBackground?: string;
  h1Variant?: HeadingVariant;
  h2Variant?: HeadingVariant;
  h3Variant?: HeadingVariant;
  linkColor?: string;
  imageBorderRadius?: number;
  dividerBorder?: string;
}

export interface SavedTheme {
  id: string;
  name: string;
  baseThemeId: string;
  overrides: ThemeOverrides;
  customCss?: string;
  createdAt: number;
  updatedAt: number;
}
