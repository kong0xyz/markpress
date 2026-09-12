import type { HeadingDecoration } from "./types";

/**
 * Shared ornament language for headings: short line + ringed dot.
 * Keep shapes simple (circle / line) so WeChat paste is more likely to keep them.
 */
export function renderHeadingDecoration(
  decoration: HeadingDecoration | undefined,
  color: string,
  titleHtml: string
): { before: string; inner: string; after: string } {
  const deco = decoration || "none";
  if (deco === "none") return { before: "", inner: titleHtml, after: "" };

  if (deco === "prefix") {
    return {
      before: "",
      inner: `${prefixMark(color)}${titleHtml}`,
      after: "",
    };
  }

  // band: ornament sits under the title (works for long / wrapped lines)
  return {
    before: "",
    inner: titleHtml,
    after: `<section style="margin-top:12px;line-height:0;font-size:0;">${bandMark(color)}</section>`,
  };
}

/** Shared ringed-dot used by h2 band and h3 prefix. */
function ringedDot(color: string, cx: number, cy: number): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="3" fill="none" stroke="${color}" stroke-width="1.2" stroke-opacity="0.75"/>` +
    `<circle cx="${cx}" cy="${cy}" r="1.15" fill="${color}" fill-opacity="0.9"/>`
  );
}

/** h2 section mark: ── ○ ── under the title */
function bandMark(color: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="12" viewBox="0 0 72 12" ` +
    `style="display:inline-block;">` +
    `<line x1="4" y1="6" x2="26" y2="6" stroke="${color}" stroke-width="1.2" ` +
    `stroke-opacity="0.35" stroke-linecap="round"/>` +
    ringedDot(color, 36, 6) +
    `<line x1="46" y1="6" x2="68" y2="6" stroke="${color}" stroke-width="1.2" ` +
    `stroke-opacity="0.35" stroke-linecap="round"/>` +
    `</svg>`
  );
}

/** h3 prefix: same ringed-dot as h2, vertically centered with text */
function prefixMark(color: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" ` +
    `style="vertical-align:middle;margin-right:8px;display:inline-block;">` +
    ringedDot(color, 6, 6) +
    `</svg>`
  );
}
