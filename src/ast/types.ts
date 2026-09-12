/** Normalized document AST shared by parser and renderers. */

export type Align = "left" | "center" | "right";

export interface DocumentMeta {
  title?: string;
  author?: string;
  cover?: string;
  wechat?: DocumentWeChatOverrides;
  [key: string]: unknown;
}

export interface DocumentWeChatOverrides {
  theme?: string;
  primaryColor?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  paragraphSpacing?: number;
  maxWidth?: number;
}

export interface MarkPressDocument {
  meta: DocumentMeta;
  children: BlockNode[];
}

export type BlockNode =
  | HeadingNode
  | ParagraphNode
  | BlockquoteNode
  | CalloutNode
  | ListNode
  | CodeBlockNode
  | TableNode
  | ImageNode
  | ThematicBreakNode
  | HtmlBlockNode;

export type InlineNode =
  | TextNode
  | StrongNode
  | EmphasisNode
  | DeleteNode
  | InlineCodeNode
  | LinkNode
  | ImageNode
  | HardBreakNode
  | SoftBreakNode
  | HtmlInlineNode;

export interface HeadingNode {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: InlineNode[];
}

export interface ParagraphNode {
  type: "paragraph";
  children: InlineNode[];
}

export interface BlockquoteNode {
  type: "blockquote";
  children: BlockNode[];
}

export type CalloutKind =
  | "note"
  | "tip"
  | "warning"
  | "important"
  | "info"
  | string;

export interface CalloutNode {
  type: "callout";
  kind: CalloutKind;
  title?: string;
  children: BlockNode[];
}

export interface ListNode {
  type: "list";
  ordered: boolean;
  start?: number;
  children: ListItemNode[];
}

export interface ListItemNode {
  type: "listItem";
  children: BlockNode[];
}

export interface CodeBlockNode {
  type: "codeBlock";
  language?: string;
  value: string;
}

export interface TableNode {
  type: "table";
  header: TableCellNode[];
  align: Array<Align | null>;
  rows: TableCellNode[][];
}

export interface TableCellNode {
  type: "tableCell";
  children: InlineNode[];
}

export interface ImageNode {
  type: "image";
  src: string;
  alt?: string;
  title?: string;
  /** True when src is an Obsidian wiki-image or vault-relative path. */
  isLocal?: boolean;
}

export interface ThematicBreakNode {
  type: "thematicBreak";
}

export interface HtmlBlockNode {
  type: "htmlBlock";
  value: string;
}

export interface TextNode {
  type: "text";
  value: string;
}

export interface StrongNode {
  type: "strong";
  children: InlineNode[];
}

export interface EmphasisNode {
  type: "emphasis";
  children: InlineNode[];
}

export interface DeleteNode {
  type: "delete";
  children: InlineNode[];
}

export interface InlineCodeNode {
  type: "inlineCode";
  value: string;
}

export interface LinkNode {
  type: "link";
  href: string;
  title?: string;
  children: InlineNode[];
}

export interface HardBreakNode {
  type: "hardBreak";
}

export interface SoftBreakNode {
  type: "softBreak";
}

export interface HtmlInlineNode {
  type: "htmlInline";
  value: string;
}
