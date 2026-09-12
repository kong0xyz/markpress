import MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type {
  Align,
  BlockNode,
  DocumentMeta,
  DocumentWeChatOverrides,
  InlineNode,
  ListItemNode,
  MarkPressDocument,
  TableCellNode,
} from "../ast/types";
import { preprocessCallouts, type CalloutPlaceholder } from "./callout";
import { parseFrontmatter } from "./frontmatter";
import { preprocessWikiSyntax, type WikiImageRef } from "./images";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  // Match Obsidian default (Strict Line Breaks OFF): single newlines → soft breaks.
  breaks: true,
  typographer: false,
});

md.enable("table");
md.enable("strikethrough");

export function parseMarkdown(source: string): MarkPressDocument {
  const { content, data } = parseFrontmatter(source || "");
  const meta = normalizeMeta(data);

  const { markdown, callouts } = preprocessCallouts(content);
  const { markdown: prepared, wikiImages } = preprocessWikiSyntax(markdown);
  const tokens = md.parse(prepared, {});
  const children = tokensToBlocks(tokens, callouts, wikiImages);

  return { meta, children };
}

function normalizeMeta(data: Record<string, unknown>): DocumentMeta {
  const wechatRaw =
    data.wechat && typeof data.wechat === "object"
      ? (data.wechat as Record<string, unknown>)
      : {};
  const wechat: DocumentWeChatOverrides = {};

  if (typeof wechatRaw.theme === "string") wechat.theme = wechatRaw.theme;
  if (typeof wechatRaw.primaryColor === "string") wechat.primaryColor = wechatRaw.primaryColor;
  if (typeof wechatRaw.fontSize === "number") wechat.fontSize = wechatRaw.fontSize;
  if (typeof wechatRaw.lineHeight === "number") wechat.lineHeight = wechatRaw.lineHeight;
  if (typeof wechatRaw.letterSpacing === "number") wechat.letterSpacing = wechatRaw.letterSpacing;
  if (typeof wechatRaw.paragraphSpacing === "number") {
    wechat.paragraphSpacing = wechatRaw.paragraphSpacing;
  }
  if (typeof wechatRaw.maxWidth === "number") wechat.maxWidth = wechatRaw.maxWidth;

  return {
    title: typeof data.title === "string" ? data.title : undefined,
    author: typeof data.author === "string" ? data.author : undefined,
    cover: typeof data.cover === "string" ? data.cover : undefined,
    wechat: Object.keys(wechat).length ? wechat : undefined,
    ...data,
  };
}

function tokensToBlocks(
  tokens: Token[],
  callouts: CalloutPlaceholder[],
  wikiImages: WikiImageRef[]
): BlockNode[] {
  const blocks: BlockNode[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === "heading_open") {
      const level = Number(token.tag.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6;
      const inline = tokens[i + 1];
      blocks.push({
        type: "heading",
        level,
        children: inlineTokensToNodes(inline?.children || [], wikiImages),
      });
      i += 3;
      continue;
    }

    if (token.type === "paragraph_open") {
      const inline = tokens[i + 1];
      const children = inlineTokensToNodes(inline?.children || [], wikiImages);
      const callout = matchCalloutParagraph(children, callouts);
      if (callout) {
        blocks.push(callout);
      } else if (children.length) {
        blocks.push({ type: "paragraph", children });
      }
      i += 3;
      continue;
    }

    if (token.type === "blockquote_open") {
      const end = findClosing(tokens, i, "blockquote_open", "blockquote_close");
      const inner = tokensToBlocks(tokens.slice(i + 1, end), callouts, wikiImages);
      const asCallout = promoteCalloutFromQuote(inner, callouts);
      blocks.push(asCallout || { type: "blockquote", children: inner });
      i = end + 1;
      continue;
    }

    if (token.type === "bullet_list_open" || token.type === "ordered_list_open") {
      const ordered = token.type === "ordered_list_open";
      const end = findClosing(
        tokens,
        i,
        token.type,
        ordered ? "ordered_list_close" : "bullet_list_close"
      );
      const items = parseListItems(tokens.slice(i + 1, end), callouts, wikiImages);
      const start = ordered ? Number(token.attrGet("start") || 1) : undefined;
      blocks.push({ type: "list", ordered, start, children: items });
      i = end + 1;
      continue;
    }

    if (token.type === "fence" || token.type === "code_block") {
      blocks.push({
        type: "codeBlock",
        language: token.info?.trim() || undefined,
        value: token.content.replace(/\n$/, ""),
      });
      i += 1;
      continue;
    }

    if (token.type === "hr") {
      blocks.push({ type: "thematicBreak" });
      i += 1;
      continue;
    }

    if (token.type === "table_open") {
      const end = findClosing(tokens, i, "table_open", "table_close");
      blocks.push(parseTable(tokens.slice(i, end + 1), wikiImages));
      i = end + 1;
      continue;
    }

    if (token.type === "html_block") {
      blocks.push({ type: "htmlBlock", value: token.content });
      i += 1;
      continue;
    }

    i += 1;
  }

  return blocks;
}

function parseListItems(
  tokens: Token[],
  callouts: CalloutPlaceholder[],
  wikiImages: WikiImageRef[]
): ListItemNode[] {
  const items: ListItemNode[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].type !== "list_item_open") {
      i += 1;
      continue;
    }
    const end = findClosing(tokens, i, "list_item_open", "list_item_close");
    items.push({
      type: "listItem",
      children: tokensToBlocks(tokens.slice(i + 1, end), callouts, wikiImages),
    });
    i = end + 1;
  }
  return items;
}

function parseTable(tokens: Token[], wikiImages: WikiImageRef[]): BlockNode {
  const header: TableCellNode[] = [];
  const rows: TableCellNode[][] = [];
  const align: Array<Align | null> = [];
  let section: "head" | "body" | null = null;
  let currentRow: TableCellNode[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "thead_open") section = "head";
    if (t.type === "tbody_open") section = "body";
    if (t.type === "tr_open") currentRow = [];
    if (t.type === "tr_close") {
      if (section === "head") header.push(...currentRow);
      else if (section === "body") rows.push(currentRow);
    }
    if (t.type === "th_open" || t.type === "td_open") {
      const style = t.attrGet("style") || "";
      const alignMatch = style.match(/text-align:(left|center|right)/);
      if (section === "head") {
        const a = alignMatch?.[1];
        align.push(a === "left" || a === "center" || a === "right" ? a : null);
      }
      const inline = tokens[i + 1];
      currentRow.push({
        type: "tableCell",
        children: inlineTokensToNodes(inline?.children || [], wikiImages),
      });
    }
  }

  return { type: "table", header, align, rows };
}

function inlineTokensToNodes(tokens: Token[], wikiImages: WikiImageRef[]): InlineNode[] {
  const nodes: InlineNode[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    switch (token.type) {
      case "text":
        nodes.push(...expandWikiImagePlaceholders(token.content, wikiImages));
        i += 1;
        break;
      case "softbreak":
        nodes.push({ type: "softBreak" });
        i += 1;
        break;
      case "hardbreak":
        nodes.push({ type: "hardBreak" });
        i += 1;
        break;
      case "code_inline":
        nodes.push({ type: "inlineCode", value: token.content });
        i += 1;
        break;
      case "strong_open": {
        const end = findClosingInline(tokens, i, "strong_open", "strong_close");
        nodes.push({
          type: "strong",
          children: inlineTokensToNodes(tokens.slice(i + 1, end), wikiImages),
        });
        i = end + 1;
        break;
      }
      case "em_open": {
        const end = findClosingInline(tokens, i, "em_open", "em_close");
        nodes.push({
          type: "emphasis",
          children: inlineTokensToNodes(tokens.slice(i + 1, end), wikiImages),
        });
        i = end + 1;
        break;
      }
      case "s_open": {
        const end = findClosingInline(tokens, i, "s_open", "s_close");
        nodes.push({
          type: "delete",
          children: inlineTokensToNodes(tokens.slice(i + 1, end), wikiImages),
        });
        i = end + 1;
        break;
      }
      case "link_open": {
        const end = findClosingInline(tokens, i, "link_open", "link_close");
        nodes.push({
          type: "link",
          href: token.attrGet("href") || "",
          title: token.attrGet("title") || undefined,
          children: inlineTokensToNodes(tokens.slice(i + 1, end), wikiImages),
        });
        i = end + 1;
        break;
      }
      case "image": {
        const src = token.attrGet("src") || "";
        nodes.push({
          type: "image",
          src,
          alt: getImageAlt(token),
          title: token.attrGet("title") || undefined,
          isLocal: isLocalImageSrc(src),
        });
        i += 1;
        break;
      }
      case "html_inline":
        nodes.push({ type: "htmlInline", value: token.content });
        i += 1;
        break;
      default:
        i += 1;
        break;
    }
  }
  return nodes;
}

const WIKI_IMG_RE = /@@MPIMG(\d+)@@/g;

function expandWikiImagePlaceholders(
  text: string,
  wikiImages: WikiImageRef[]
): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  WIKI_IMG_RE.lastIndex = 0;
  while ((match = WIKI_IMG_RE.exec(text))) {
    if (match.index > last) {
      nodes.push({ type: "text", value: text.slice(last, match.index) });
    }
    const ref = wikiImages[Number(match[1])];
    if (ref) {
      nodes.push({
        type: "image",
        src: ref.src,
        alt: ref.alt,
        isLocal: true,
      });
    } else {
      nodes.push({ type: "text", value: match[0] });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    nodes.push({ type: "text", value: text.slice(last) });
  }
  if (!nodes.length && text) nodes.push({ type: "text", value: text });
  return nodes;
}

function getImageAlt(token: Token): string {
  if (!token.children) return "";
  return token.children
    .filter((c) => c.type === "text")
    .map((c) => c.content)
    .join("");
}

export function isLocalImageSrc(src: string): boolean {
  if (!src) return false;
  if (/^(https?:|data:|blob:|\/\/)/i.test(src)) return false;
  return true;
}

function findClosing(tokens: Token[], start: number, open: string, close: string): number {
  let depth = 0;
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i].type === open) depth += 1;
    if (tokens[i].type === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return tokens.length - 1;
}

function findClosingInline(tokens: Token[], start: number, open: string, close: string): number {
  return findClosing(tokens, start, open, close);
}

function matchCalloutParagraph(
  children: InlineNode[],
  callouts: CalloutPlaceholder[]
): BlockNode | null {
  if (children.length !== 1 || children[0].type !== "text") return null;
  const text = children[0].value.trim();
  const m = text.match(/^%%MARKPRESS_CALLOUT:(\d+)%%$/);
  if (!m) return null;
  const placeholder = callouts[Number(m[1])];
  if (!placeholder) return null;
  return {
    type: "callout",
    kind: placeholder.kind,
    title: placeholder.title,
    children: parseMarkdown(placeholder.body).children,
  };
}

function promoteCalloutFromQuote(
  inner: BlockNode[],
  _callouts: CalloutPlaceholder[]
): BlockNode | null {
  // Fallback: detect raw callout syntax that survived preprocessing
  if (!inner.length) return null;
  const first = inner[0];
  if (first.type !== "paragraph" || !first.children.length) return null;
  const lead = first.children[0];
  if (lead.type !== "text") return null;
  const m = lead.value.match(/^\[!(\w+)\]\s*(.*)$/i);
  if (!m) return null;

  const kind = m[1].toLowerCase();
  const title = m[2]?.trim() || undefined;
  const restInlines = [...first.children];
  restInlines[0] = { type: "text", value: lead.value.replace(/^\[!\w+\]\s*/i, "") };
  const children: BlockNode[] = [];
  if (restInlines.some((n) => n.type !== "text" || n.value.trim())) {
    children.push({ type: "paragraph", children: restInlines });
  }
  children.push(...inner.slice(1));
  return { type: "callout", kind, title, children };
}
