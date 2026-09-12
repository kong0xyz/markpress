import type {
  BlockNode,
  CalloutKind,
  CalloutNode,
  HeadingNode,
  ImageNode,
  InlineNode,
  ListNode,
  MarkPressDocument,
  TableNode,
} from "../ast/types";
import type { HeadingStyle, WeChatTheme } from "../themes/types";
import { renderHeadingDecoration } from "../themes/headingDecor";
import { articleShell, escapeHtml, styleAttr } from "./html";

export type ImageMode = "preview" | "copy";

export interface ImageResolver {
  resolve(src: string, isLocal?: boolean): Promise<string>;
}

export interface RenderOptions {
  theme: WeChatTheme;
  imageResolver?: ImageResolver;
  /** Only affects images (blob vs base64). Styles are identical. */
  mode?: ImageMode;
}

const CALLOUT_ACCENTS: Record<string, { color: string; label: string }> = {
  note: { color: "#625fff", label: "NOTE" },
  tip: { color: "#07c160", label: "TIP" },
  warning: { color: "#fa9d3b", label: "WARNING" },
  important: { color: "#f44336", label: "IMPORTANT" },
  info: { color: "#3b82f6", label: "INFO" },
};

export async function renderWeChatHtml(
  doc: MarkPressDocument,
  options: RenderOptions
): Promise<string> {
  const parts: string[] = [];
  for (const node of doc.children) {
    parts.push(await renderBlock(node, options));
  }
  return articleShell(options.theme, parts.join(""));
}

export function renderWeChatPlainText(doc: MarkPressDocument): string {
  return doc.children.map(blockToPlain).join("\n\n").trim();
}

async function renderBlock(node: BlockNode, options: RenderOptions): Promise<string> {
  switch (node.type) {
    case "heading":
      return renderHeading(node, options);
    case "paragraph": {
      const onlyImage = extractSoleImage(node.children);
      if (onlyImage) return renderImage(onlyImage, options, true);
      return `<p${paragraphStyle(options.theme)}>${await renderInlines(node.children, options)}</p>`;
    }
    case "blockquote": {
      const quoteOptions: RenderOptions = {
        ...options,
        theme: {
          ...options.theme,
          paragraph: { marginTop: 0, marginBottom: 8 },
        },
      };
      const inner = (
        await Promise.all(node.children.map((c) => renderBlock(c, quoteOptions)))
      ).join("");
      // Use <section>, not <blockquote>: WeChat injects its own gray left bar on blockquote.
      return `<section${quoteStyle(options.theme)}>${inner}</section>`;
    }
    case "callout":
      return renderCallout(node, options);
    case "list":
      return renderList(node, options);
    case "codeBlock":
      return renderCodeBlock(node.value, options.theme);
    case "table":
      return renderTable(node, options);
    case "image":
      return renderImage(node, options, true);
    case "thematicBreak":
      return renderDivider(options.theme);
    case "htmlBlock":
      return "";
    default:
      return "";
  }
}

function renderHeading(node: HeadingNode, options: RenderOptions): string {
  const theme = options.theme;
  const level = Math.min(Math.max(node.level, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
  const style = theme[`h${level}` as keyof WeChatTheme] as HeadingStyle;
  const tag = `h${level}`;
  const titleHtml = renderInlinesSync(node.children, options);
  // Decorations follow theme primary (same as h2), not the heading text color.
  const decoColor = theme.colors.primary;
  const { before, inner, after } = renderHeadingDecoration(
    style.decoration,
    decoColor,
    titleHtml
  );

  const headingAttr = styleAttr({
    margin: "0",
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    color: style.color,
    textAlign: style.align,
    lineHeight: 1.45,
    padding: style.padding === "0" ? undefined : style.padding,
    borderRadius: style.borderRadius || undefined,
    background: style.background,
    border: "none",
    borderLeft: style.borderLeft,
    borderBottom: style.borderBottom,
  });

  const wrapAttr = styleAttr({
    margin: `${style.marginTop}px 0 ${style.marginBottom}px`,
    textAlign: style.align,
  });

  return `<section${wrapAttr}>${before}<${tag}${headingAttr}>${inner}</${tag}>${after}</section>`;
}

async function renderCallout(node: CalloutNode, options: RenderOptions): Promise<string> {
  const theme = options.theme;
  const kind = (node.kind || "note").toLowerCase() as CalloutKind;
  const accent = CALLOUT_ACCENTS[kind] || {
    color: theme.colors.primary,
    label: String(node.kind || "NOTE").toUpperCase(),
  };
  const title = node.title || accent.label;
  const body = (await Promise.all(node.children.map((c) => renderBlock(c, options)))).join("");
  const section = styleAttr({
    padding: theme.callout.padding,
    margin: `${theme.callout.marginTop}px 0 ${theme.callout.marginBottom}px`,
    background: theme.callout.background,
    borderLeft: theme.callout.borderLeftWidth
      ? `${theme.callout.borderLeftWidth}px solid ${accent.color}`
      : undefined,
    border: theme.callout.border,
    borderRadius: theme.callout.borderRadius,
  });
  const titleStyle = styleAttr({
    fontWeight: theme.callout.titleWeight,
    color: accent.color,
    margin: "0 0 8px",
    fontSize: theme.typography.fontSize,
  });
  return `<section${section}><p${titleStyle}>${escapeHtml(title)}</p>${body}</section>`;
}

async function renderList(node: ListNode, options: RenderOptions): Promise<string> {
  const theme = options.theme;
  const tag = node.ordered ? "ol" : "ul";
  const startAttr = node.ordered && node.start && node.start !== 1 ? ` start="${node.start}"` : "";
  const listStyle = styleAttr({
    margin: `${theme.list.marginTop}px 0 ${theme.list.marginBottom}px`,
    paddingLeft: theme.list.paddingLeft,
  });
  const items: string[] = [];
  for (const item of node.children) {
    const inner = (await Promise.all(item.children.map((c) => renderBlock(c, options)))).join("");
    const li = styleAttr({
      margin: `0 0 ${theme.list.itemSpacing}px`,
      lineHeight: theme.typography.lineHeight,
    });
    items.push(`<li${li}>${inner || "&nbsp;"}</li>`);
  }
  return `<${tag}${startAttr}${listStyle}>${items.join("")}</${tag}>`;
}

function renderCodeBlock(value: string, theme: WeChatTheme): string {
  // WeChat strips / ignores many styles on <pre>/<code> (esp. font-size + white-space),
  // so use section + <br/> + nbsp — same approach as tables/quotes.
  const outer = styleAttr({
    margin: `${theme.code.marginTop}px 0 ${theme.code.marginBottom}px`,
    padding: theme.code.padding,
    background: theme.code.background,
    borderRadius: theme.code.borderRadius,
    border: theme.code.border,
    overflow: "auto",
    color: theme.code.color,
    fontSize: theme.code.fontSize,
    lineHeight: theme.code.lineHeight,
    fontFamily: theme.code.fontFamily,
  });

  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const trimmed = normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized;
  const body = trimmed
    .split("\n")
    .map((line) => {
      const text = preserveCodeWhitespace(escapeHtml(line));
      return text.length ? text : "&nbsp;";
    })
    .join("<br/>");

  const inner = styleAttr({
    display: "block",
    margin: 0,
    padding: 0,
    fontFamily: theme.code.fontFamily,
    fontSize: theme.code.fontSize,
    lineHeight: theme.code.lineHeight,
    color: theme.code.color,
    background: "transparent",
    letterSpacing: 0,
    wordBreak: "break-word",
  });

  return `<section${outer}><section${inner}>${body}</section></section>`;
}

/** WeChat collapses normal spaces in rich text; nbsp keeps indentation. */
function preserveCodeWhitespace(text: string): string {
  return text.replace(/\t/g, "    ").replace(/ /g, "\u00A0");
}

async function renderTable(node: TableNode, options: RenderOptions): Promise<string> {
  const theme = options.theme;
  const borderColor = theme.table.borderColor;
  const headerBg = theme.table.headerBackground;
  const headerColor = theme.table.headerColor || theme.colors.text;
  const bodyColor = theme.table.textColor || theme.colors.text;
  const bodyBg = theme.colors.background;
  const pad = theme.table.cellPadding;
  const fontSize = Math.min(theme.table.fontSize, 14);
  const colCount = Math.max(
    node.header.length,
    ...node.rows.map((r) => r.length),
    1
  );
  const colWidth = `${(100 / colCount).toFixed(4)}%`;

  /**
   * WeChat rewrites native <table>/<td> (esp. night mode → gray header + grid).
   * Use section + display:table/table-cell — same look, far more stable in 公众号.
   */
  const renderRow = async (
    cells: typeof node.header,
    align: Array<"left" | "center" | "right" | null>,
    opts: { header?: boolean; last?: boolean }
  ): Promise<string> => {
    const isHeader = !!opts.header;
    const parts = await Promise.all(
      Array.from({ length: colCount }, async (_, idx) => {
        const cell = cells[idx];
        const content = cell
          ? await renderInlines(cell.children, options)
          : "&nbsp;";
        const cellStyle = styleAttr({
          display: "table-cell",
          width: colWidth,
          padding: pad,
          fontSize,
          lineHeight: 1.6,
          fontWeight: isHeader ? 600 : 400,
          color: isHeader ? headerColor : bodyColor,
          background: isHeader ? headerBg : bodyBg,
          // Horizontal rules only — no vertical grid (shadcn card look).
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          borderBottom:
            opts.last && !isHeader ? "none" : `1px solid ${borderColor}`,
          textAlign: align[idx] || "left",
          wordBreak: "break-word",
          verticalAlign: "middle",
        });
        return `<section${cellStyle}>${content}</section>`;
      })
    );

    const rowStyle = styleAttr({
      display: "table",
      width: "100%",
      borderCollapse: "collapse",
      background: isHeader ? headerBg : bodyBg,
    });
    return `<section${rowStyle}>${parts.join("")}</section>`;
  };

  const headerRow = await renderRow(node.header, node.align, { header: true });
  const bodyRows = await Promise.all(
    node.rows.map((row, i) =>
      renderRow(row, node.align, {
        last: i === node.rows.length - 1,
      })
    )
  );

  const wrap = styleAttr({
    margin: `${theme.table.marginTop}px 0 ${theme.table.marginBottom}px`,
    border: `1px solid ${borderColor}`,
    borderRadius: theme.table.borderRadius || 8,
    overflow: "hidden",
    width: "100%",
    maxWidth: "100%",
    background: bodyBg,
  });

  return `<section${wrap}>${headerRow}${bodyRows.join("")}</section>`;
}

async function renderImage(
  node: ImageNode,
  options: RenderOptions,
  asBlock: boolean
): Promise<string> {
  const theme = options.theme;
  let src = node.src;
  if (options.imageResolver) {
    src = await options.imageResolver.resolve(node.src, node.isLocal);
  }
  const img = styleAttr({
    display: theme.image.display,
    maxWidth: theme.image.maxWidth,
    width: "100%",
    height: "auto",
    margin: asBlock
      ? `${theme.image.marginTop}px 0 ${theme.image.marginBottom}px`
      : "0",
    borderRadius: theme.image.borderRadius,
  });
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(node.alt || "")}"${img}/>`;
}

function renderDivider(theme: WeChatTheme): string {
  const hr = styleAttr({
    border: "none",
    borderTop: theme.divider.borderTop,
    margin: `${theme.divider.marginTop}px auto ${theme.divider.marginBottom}px`,
    width: theme.divider.width,
    height: 0,
  });
  return `<hr${hr}/>`;
}

async function renderInlines(nodes: InlineNode[], options: RenderOptions): Promise<string> {
  const parts: string[] = [];
  for (const node of nodes) parts.push(await renderInline(node, options));
  return parts.join("");
}

function renderInlinesSync(nodes: InlineNode[], options: RenderOptions): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return escapeHtml(node.value);
      if (node.type === "softBreak" || node.type === "hardBreak") return "<br/>";
      if (node.type === "strong") {
        return `<strong${strongStyle(options.theme)}>${renderInlinesSync(node.children, options)}</strong>`;
      }
      if (node.type === "emphasis") {
        return `<em${emStyle()}>${renderInlinesSync(node.children, options)}</em>`;
      }
      if (node.type === "delete") {
        return `<s${deleteStyle()}>${renderInlinesSync(node.children, options)}</s>`;
      }
      if (node.type === "inlineCode") {
        return `<code${inlineCodeStyle(options.theme)}>${escapeHtml(node.value)}</code>`;
      }
      if (node.type === "link") {
        const label = renderInlinesSync(node.children, options) || escapeHtml(node.href);
        return `<a href="${escapeHtml(node.href)}"${linkStyle(options.theme)}>${label}</a>`;
      }
      if (node.type === "image") return escapeHtml(node.alt || "");
      return "";
    })
    .join("");
}

async function renderInline(node: InlineNode, options: RenderOptions): Promise<string> {
  switch (node.type) {
    case "text":
      return escapeHtml(node.value);
    case "softBreak":
    case "hardBreak":
      return "<br/>";
    case "strong":
      return `<strong${strongStyle(options.theme)}>${await renderInlines(node.children, options)}</strong>`;
    case "emphasis":
      return `<em${emStyle()}>${await renderInlines(node.children, options)}</em>`;
    case "delete":
      return `<s${deleteStyle()}>${await renderInlines(node.children, options)}</s>`;
    case "inlineCode":
      return `<code${inlineCodeStyle(options.theme)}>${escapeHtml(node.value)}</code>`;
    case "link": {
      const label = (await renderInlines(node.children, options)) || escapeHtml(node.href);
      return `<a href="${escapeHtml(node.href)}"${linkStyle(options.theme)}>${label}</a>`;
    }
    case "image":
      return renderImage(node, options, false);
    default:
      return "";
  }
}

function extractSoleImage(nodes: InlineNode[]): ImageNode | null {
  const meaningful = nodes.filter(
    (n) => !(n.type === "text" && !n.value.trim()) && n.type !== "softBreak"
  );
  if (meaningful.length === 1 && meaningful[0].type === "image") return meaningful[0];
  return null;
}

function paragraphStyle(theme: WeChatTheme): string {
  return styleAttr({
    margin: `${theme.paragraph.marginTop}px 0 ${theme.paragraph.marginBottom}px`,
    padding: 0,
    fontSize: theme.typography.fontSize,
    lineHeight: theme.typography.lineHeight,
    letterSpacing: theme.typography.letterSpacing,
    color: theme.colors.text,
    textAlign: "justify",
  });
}

function quoteStyle(theme: WeChatTheme): string {
  const borderLeft =
    !theme.quote.borderLeft || theme.quote.borderLeft === "none"
      ? "none"
      : theme.quote.borderLeft;
  return styleAttr({
    margin: `${theme.quote.marginTop}px 0 ${theme.quote.marginBottom}px`,
    padding: theme.quote.padding,
    background:
      theme.quote.background === "transparent" ? undefined : theme.quote.background,
    border: "none",
    borderLeft,
    borderRadius: theme.quote.borderRadius || undefined,
    color: theme.quote.color,
    fontSize: theme.quote.fontSize || theme.typography.fontSize,
    fontStyle: theme.quote.fontStyle || "normal",
    lineHeight: theme.quote.lineHeight || theme.typography.lineHeight,
    display: "block",
  });
}

/** Bold uses theme primary so emphasis reads clearly in WeChat body text. */
function strongStyle(theme: WeChatTheme): string {
  return styleAttr({
    fontWeight: 700,
    color: theme.colors.primary,
  });
}

function emStyle(): string {
  return styleAttr({ fontStyle: "italic" });
}

function deleteStyle(): string {
  return styleAttr({ textDecoration: "line-through" });
}

function inlineCodeStyle(theme: WeChatTheme): string {
  return styleAttr({
    background: theme.inlineCode.background,
    color: theme.inlineCode.color,
    fontFamily: theme.inlineCode.fontFamily,
    fontSize: theme.inlineCode.fontSize,
    padding: theme.inlineCode.padding,
    borderRadius: theme.inlineCode.borderRadius,
  });
}

function linkStyle(theme: WeChatTheme): string {
  return styleAttr({
    color: theme.link.color,
    textDecoration: theme.link.textDecoration,
  });
}

function blockToPlain(node: BlockNode): string {
  switch (node.type) {
    case "heading":
    case "paragraph":
      return inlinesToPlain(node.children);
    case "blockquote":
    case "callout":
      return node.children.map(blockToPlain).join("\n");
    case "list":
      return node.children
        .map((item, idx) => {
          const prefix = node.ordered ? `${(node.start || 1) + idx}. ` : "- ";
          return prefix + item.children.map(blockToPlain).join(" ");
        })
        .join("\n");
    case "codeBlock":
      return node.value;
    case "table": {
      const header = node.header.map((c) => inlinesToPlain(c.children)).join("\t");
      const rows = node.rows.map((r) => r.map((c) => inlinesToPlain(c.children)).join("\t"));
      return [header, ...rows].join("\n");
    }
    case "image":
      return node.alt || "";
    case "thematicBreak":
      return "---";
    default:
      return "";
  }
}

function inlinesToPlain(nodes: InlineNode[]): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case "text":
          return n.value;
        case "softBreak":
        case "hardBreak":
          return "\n";
        case "strong":
        case "emphasis":
        case "delete":
        case "link":
          return inlinesToPlain(n.children);
        case "inlineCode":
          return n.value;
        case "image":
          return n.alt || "";
        default:
          return "";
      }
    })
    .join("");
}
