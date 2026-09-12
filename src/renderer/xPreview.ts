/**
 * Lightweight HTML preview for X Articles (structure-first, not WeChat themes).
 * Local images still use the preview ImageResolver (blob URLs).
 */
import type {
  BlockNode,
  InlineNode,
  ListNode,
  MarkPressDocument,
  TableNode,
} from "../ast/types";
import type { ImageResolver } from "./wechat";
import { escapeHtml, styleAttr } from "./html";

export async function renderXPreviewHtml(
  doc: MarkPressDocument,
  imageResolver?: ImageResolver
): Promise<string> {
  const body = (
    await Promise.all(doc.children.map((b) => renderBlock(b, imageResolver)))
  ).join("");

  const shell = styleAttr({
    maxWidth: 680,
    margin: "0 auto",
    padding: "8px 4px 24px",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize: 16,
    lineHeight: 1.7,
    color: "#0f1419",
    background: "#ffffff",
    wordWrap: "break-word",
  });

  return `<section${shell}>${body}</section>`;
}

async function renderBlock(
  node: BlockNode,
  imageResolver?: ImageResolver
): Promise<string> {
  switch (node.type) {
    case "heading": {
      const level = Math.min(Math.max(node.level, 1), 6);
      const sizes = [28, 22, 18, 16, 15, 14];
      const attr = styleAttr({
        margin: level === 1 ? "8px 0 16px" : "28px 0 12px",
        fontSize: sizes[level - 1],
        fontWeight: level <= 2 ? 700 : 600,
        color: "#0f1419",
        lineHeight: 1.35,
      });
      const inner = await renderInlines(node.children, imageResolver);
      return `<h${level}${attr}>${inner}</h${level}>`;
    }
    case "paragraph": {
      const attr = styleAttr({ margin: "0 0 16px", fontSize: 16, lineHeight: 1.7 });
      const inner = await renderInlines(node.children, imageResolver);
      return `<p${attr}>${inner || "&nbsp;"}</p>`;
    }
    case "blockquote":
    case "callout": {
      const attr = styleAttr({
        margin: "16px 0",
        padding: "0 0 0 14px",
        borderLeft: "3px solid #cfd9de",
        color: "#536471",
      });
      const inner = (
        await Promise.all(node.children.map((c) => renderBlock(c, imageResolver)))
      ).join("");
      const title =
        node.type === "callout"
          ? `<p${styleAttr({ margin: "0 0 8px", fontWeight: 700, color: "#0f1419" })}>${escapeHtml(
              node.title || String(node.kind || "NOTE").toUpperCase()
            )}</p>`
          : "";
      return `<section${attr}>${title}${inner}</section>`;
    }
    case "list":
      return renderList(node, imageResolver);
    case "codeBlock": {
      const pre = styleAttr({
        margin: "16px 0",
        padding: "12px 14px",
        background: "#f7f9f9",
        border: "1px solid #eff3f4",
        borderRadius: 8,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: 13,
        lineHeight: 1.55,
        color: "#0f1419",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      });
      return `<pre${pre}>${escapeHtml(node.value)}</pre>`;
    }
    case "table":
      return renderTable(node, imageResolver);
    case "image":
      return renderImage(node, imageResolver);
    case "thematicBreak": {
      const attr = styleAttr({
        margin: "24px 0",
        border: "none",
        borderTop: "1px solid #eff3f4",
      });
      return `<hr${attr}/>`;
    }
    case "htmlBlock":
      return node.value;
    default:
      return "";
  }
}

async function renderList(node: ListNode, imageResolver?: ImageResolver): Promise<string> {
  const tag = node.ordered ? "ol" : "ul";
  const listAttr = styleAttr({
    margin: "0 0 16px",
    paddingLeft: 24,
  });
  const items: string[] = [];
  for (const item of node.children) {
    const liAttr = styleAttr({ margin: "0 0 6px" });
    const inner = (
      await Promise.all(item.children.map((c) => renderBlock(c, imageResolver)))
    ).join("");
    items.push(`<li${liAttr}>${inner || "&nbsp;"}</li>`);
  }
  const start =
    node.ordered && node.start && node.start !== 1 ? ` start="${node.start}"` : "";
  return `<${tag}${start}${listAttr}>${items.join("")}</${tag}>`;
}

async function renderTable(node: TableNode, imageResolver?: ImageResolver): Promise<string> {
  const wrap = styleAttr({
    margin: "16px 0",
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  });
  const cell = (header: boolean) =>
    styleAttr({
      border: "1px solid #eff3f4",
      padding: "8px 10px",
      textAlign: "left",
      background: header ? "#f7f9f9" : undefined,
      fontWeight: header ? 600 : 400,
      verticalAlign: "middle",
    });

  const headCells = (
    await Promise.all(
      node.header.map(async (c) => {
        const inner = await renderInlines(c.children, imageResolver);
        return `<th${cell(true)}>${inner || "&nbsp;"}</th>`;
      })
    )
  ).join("");

  const bodyRows = (
    await Promise.all(
      node.rows.map(async (row) => {
        const tds = (
          await Promise.all(
            row.map(async (c) => {
              const inner = await renderInlines(c.children, imageResolver);
              return `<td${cell(false)}>${inner || "&nbsp;"}</td>`;
            })
          )
        ).join("");
        return `<tr>${tds}</tr>`;
      })
    )
  ).join("");

  return `<table${wrap}><thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

async function renderImage(
  node: { src: string; alt?: string; isLocal?: boolean },
  imageResolver?: ImageResolver
): Promise<string> {
  const src = imageResolver
    ? await imageResolver.resolve(node.src, node.isLocal)
    : node.src;
  const attr = styleAttr({
    display: "block",
    maxWidth: "100%",
    margin: "16px 0",
    borderRadius: 8,
  });
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(node.alt || "")}"${attr}/>`;
}

async function renderInlines(
  nodes: InlineNode[],
  imageResolver?: ImageResolver
): Promise<string> {
  const parts: string[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        parts.push(escapeHtml(node.value));
        break;
      case "softBreak":
      case "hardBreak":
        parts.push("<br/>");
        break;
      case "strong":
        parts.push(
          `<strong${styleAttr({ fontWeight: 700 })}>${await renderInlines(
            node.children,
            imageResolver
          )}</strong>`
        );
        break;
      case "emphasis":
        parts.push(`<em>${await renderInlines(node.children, imageResolver)}</em>`);
        break;
      case "delete":
        parts.push(`<s>${await renderInlines(node.children, imageResolver)}</s>`);
        break;
      case "inlineCode": {
        const attr = styleAttr({
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: 13,
          background: "#f7f9f9",
          padding: "1px 5px",
          borderRadius: 4,
        });
        parts.push(`<code${attr}>${escapeHtml(node.value)}</code>`);
        break;
      }
      case "link": {
        const label =
          (await renderInlines(node.children, imageResolver)) || escapeHtml(node.href);
        const attr = styleAttr({ color: "#1d9bf0", textDecoration: "underline" });
        parts.push(
          `<a href="${escapeHtml(node.href)}"${attr}>${label}</a>`
        );
        break;
      }
      case "image":
        parts.push(await renderImage(node, imageResolver));
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
