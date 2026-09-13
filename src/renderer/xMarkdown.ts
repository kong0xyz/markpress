import type {
  BlockNode,
  CalloutNode,
  InlineNode,
  ListNode,
  MarkPressDocument,
  TableNode,
} from "../ast/types";

export interface XImageRef {
  /** Original src from the note (wiki path or URL). */
  src: string;
  alt: string;
  /** Final URL written into Markdown. */
  url: string;
  /** True when url is vault-relative / unresolved (X cannot fetch it). */
  localUnresolved: boolean;
}

export interface RenderXMarkdownResult {
  markdown: string;
  images: XImageRef[];
  unresolvedLocalCount: number;
}

export type XImageUrlResolver = (
  src: string,
  isLocal: boolean | undefined,
  alt: string
) => Promise<XImageRef>;

/**
 * Serialize AST → native Markdown for X Articles paste.
 * Images go through `resolveImage` so Obsidian wiki/local paths can become public URLs.
 */
export async function renderXMarkdown(
  doc: MarkPressDocument,
  resolveImage: XImageUrlResolver
): Promise<RenderXMarkdownResult> {
  const images: XImageRef[] = [];
  const parts: string[] = [];

  const resolve = async (
    src: string,
    isLocal: boolean | undefined,
    alt: string
  ): Promise<XImageRef> => {
    const ref = await resolveImage(src, isLocal, alt);
    images.push(ref);
    return ref;
  };

  for (const block of doc.children) {
    const chunk = await renderBlock(block, resolve, 0);
    if (chunk) parts.push(chunk);
  }

  const markdown = parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  const unresolvedLocalCount = images.filter((i) => i.localUnresolved).length;
  return { markdown, images, unresolvedLocalCount };
}

async function renderBlock(
  node: BlockNode,
  resolve: XImageUrlResolver,
  listDepth: number
): Promise<string> {
  switch (node.type) {
    case "heading": {
      const level = Math.min(Math.max(node.level, 1), 6);
      const text = await renderInlines(node.children, resolve);
      return `${"#".repeat(level)} ${text}`;
    }
    case "paragraph": {
      // Standalone image paragraph → block image (cleaner for X)
      if (node.children.length === 1 && node.children[0].type === "image") {
        return renderImageMarkdown(node.children[0], resolve);
      }
      return renderInlines(node.children, resolve);
    }
    case "blockquote": {
      const inner = (
        await Promise.all(node.children.map((c) => renderBlock(c, resolve, listDepth)))
      )
        .filter(Boolean)
        .join("\n\n");
      return prefixLines(inner, "> ");
    }
    case "callout":
      return renderCallout(node, resolve);
    case "list":
      return renderList(node, resolve, listDepth);
    case "codeBlock": {
      const lang = node.language || "";
      return `\`\`\`${lang}\n${node.value.replace(/\n$/, "")}\n\`\`\``;
    }
    case "table":
      return renderTable(node, resolve);
    case "image":
      return renderImageMarkdown(node, resolve);
    case "thematicBreak":
      return "---";
    case "htmlBlock":
      return node.value.trim();
    default:
      return "";
  }
}

async function renderCallout(
  node: CalloutNode,
  resolve: XImageUrlResolver
): Promise<string> {
  const title = node.title || String(node.kind || "note").toUpperCase();
  const body = (
    await Promise.all(node.children.map((c) => renderBlock(c, resolve, 0)))
  )
    .filter(Boolean)
    .join("\n\n");
  const head = `> **${escapeMdInline(title)}**`;
  if (!body) return head;
  return `${head}\n${prefixLines(body, "> ")}`;
}

async function renderList(
  node: ListNode,
  resolve: XImageUrlResolver,
  depth: number
): Promise<string> {
  const lines: string[] = [];
  let index = node.start ?? 1;
  for (const item of node.children) {
    const marker = node.ordered ? `${index}. ` : "- ";
    index += 1;
    const chunks: string[] = [];
    for (const child of item.children) {
      if (child.type === "list") {
        chunks.push(await renderList(child, resolve, depth + 1));
      } else {
        const text = await renderBlock(child, resolve, depth + 1);
        if (text) chunks.push(text);
      }
    }
    if (!chunks.length) {
      lines.push(`${"  ".repeat(depth)}${marker}`);
      continue;
    }
    const [first, ...rest] = chunks;
    const firstLines = first.split("\n");
    lines.push(`${"  ".repeat(depth)}${marker}${firstLines[0]}`);
    for (const extra of firstLines.slice(1)) {
      lines.push(`${"  ".repeat(depth)}${" ".repeat(marker.length)}${extra}`);
    }
    for (const block of rest) {
      for (const line of block.split("\n")) {
        lines.push(`${"  ".repeat(depth)}${" ".repeat(marker.length)}${line}`);
      }
    }
  }
  return lines.join("\n");
}

async function renderTable(
  node: TableNode,
  resolve: XImageUrlResolver
): Promise<string> {
  const header = await Promise.all(
    node.header.map(async (cell) => (await renderInlines(cell.children, resolve)).trim() || " ")
  );
  const aligns = node.align.map((a) => {
    if (a === "center") return ":---:";
    if (a === "right") return "---:";
    return "---";
  });
  while (aligns.length < header.length) aligns.push("---");

  const rows: string[][] = [];
  for (const row of node.rows) {
    const cells = await Promise.all(
      row.map(async (cell) => (await renderInlines(cell.children, resolve)).trim() || " ")
    );
    while (cells.length < header.length) cells.push(" ");
    rows.push(cells.slice(0, header.length));
  }

  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${aligns.slice(0, header.length).join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ];
  return lines.join("\n");
}

async function renderImageMarkdown(
  node: { src: string; alt?: string; title?: string; isLocal?: boolean },
  resolve: XImageUrlResolver
): Promise<string> {
  const alt = node.alt || "";
  const ref = await resolve(node.src, node.isLocal, alt);
  const title = node.title ? ` "${escapeMdTitle(node.title)}"` : "";
  return `![${escapeMdAlt(alt)}](${ref.url}${title})`;
}

async function renderInlines(
  nodes: InlineNode[],
  resolve: XImageUrlResolver
): Promise<string> {
  const parts: string[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        parts.push(escapeMdText(node.value));
        break;
      case "softBreak":
        parts.push("\n");
        break;
      case "hardBreak":
        parts.push("  \n");
        break;
      case "strong":
        parts.push(`**${await renderInlines(node.children, resolve)}**`);
        break;
      case "emphasis":
        parts.push(`*${await renderInlines(node.children, resolve)}*`);
        break;
      case "delete":
        parts.push(`~~${await renderInlines(node.children, resolve)}~~`);
        break;
      case "inlineCode":
        parts.push(wrapInlineCode(node.value));
        break;
      case "link": {
        const label = (await renderInlines(node.children, resolve)) || node.href;
        parts.push(`[${label}](${node.href})`);
        break;
      }
      case "image":
        parts.push(await renderImageMarkdown(node, resolve));
        break;
      case "htmlInline":
        parts.push(node.value);
        break;
      default:
        break;
    }
  }
  return parts.join("");
}

function prefixLines(text: string, prefix: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (line.length > 0) {
      out.push(prefix + line);
    } else {
      out.push(prefix.replace(/\s+$/u, ""));
    }
  }
  return out.join("\n");
}

function wrapInlineCode(value: string): string {
  const ticks = value.includes("`") ? "``" : "`";
  return `${ticks}${value}${ticks}`;
}

function escapeMdText(text: string): string {
  // Only escape chars that would re-open Markdown syntax when round-tripping AST → MD.
  return text.replace(/([\\`*_[\]])/g, "\\$1");
}

function escapeMdInline(text: string): string {
  return text.replace(/\*/g, "\\*");
}

function escapeMdAlt(text: string): string {
  return text.replace(/[[\]]/g, "");
}

function escapeMdTitle(text: string): string {
  return text.replace(/"/g, '\\"');
}
