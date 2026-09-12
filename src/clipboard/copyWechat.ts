/** Copy WeChat rich text via Clipboard API only (no DOM / execCommand fallbacks). */
export async function copyRichText(html: string, plainText: string): Promise<void> {
  const plain = plainText || htmlToPlain(html);
  const htmlDoc = wrapClipboardHtml(html);

  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([htmlDoc], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      }),
    ]);
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(plain);
    return;
  }

  throw new Error("Clipboard API unavailable");
}

function wrapClipboardHtml(html: string): string {
  return `<!DOCTYPE html><html><body><!--StartFragment-->${html}<!--EndFragment--></body></html>`;
}

function htmlToPlain(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}
