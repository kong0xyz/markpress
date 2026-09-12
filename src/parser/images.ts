export interface WikiImageRef {
  src: string;
  alt: string;
}

/**
 * Normalize Obsidian wiki image / link syntax before markdown-it parsing.
 *
 * Wiki images become opaque placeholders (@@MPIMGn@@) so markdown-it cannot
 * split them via emphasis (`_foo_`) when filenames contain underscores.
 *
 * [[Note Name]] → plain text (MVP: keep label)
 */
export function preprocessWikiSyntax(markdown: string): {
  markdown: string;
  wikiImages: WikiImageRef[];
} {
  const wikiImages: WikiImageRef[] = [];

  let text = markdown.replace(/!\[\[([^\]]+)\]\]/g, (_m, inner: string) => {
    const [target, alias] = splitWiki(inner);
    const src = target.trim();
    const alt = (alias || src).trim();
    const idx = wikiImages.length;
    wikiImages.push({ src, alt });
    return `@@MPIMG${idx}@@`;
  });

  text = text.replace(/\[\[([^\]]+)\]\]/g, (_m, inner: string) => {
    const [target, alias] = splitWiki(inner);
    return alias?.trim() || target.trim();
  });

  return { markdown: text, wikiImages };
}

function splitWiki(inner: string): [string, string | undefined] {
  const pipe = inner.indexOf("|");
  if (pipe < 0) return [inner, undefined];
  return [inner.slice(0, pipe), inner.slice(pipe + 1)];
}

export function isRemoteUrl(src: string): boolean {
  return /^(https?:)?\/\//i.test(src) || /^data:/i.test(src) || /^blob:/i.test(src);
}
