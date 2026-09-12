export async function copyRichText(html: string, plainText: string): Promise<void> {
  const htmlBlob = new Blob([wrapClipboardHtml(html)], { type: "text/html" });
  const textBlob = new Blob([plainText || stripTags(html)], { type: "text/plain" });

  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ]);
      return;
    } catch {
      // fall through
    }
  }

  fallbackCopy(html, plainText || stripTags(html));
}

function wrapClipboardHtml(html: string): string {
  // Some editors (incl. WeChat) prefer a full HTML fragment document.
  return `<!DOCTYPE html><html><body><!--StartFragment-->${html}<!--EndFragment--></body></html>`;
}

function fallbackCopy(html: string, plain: string): void {
  const container = document.createElement("div");
  container.setAttribute("contenteditable", "true");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = html;
  document.body.appendChild(container);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(container);
  selection?.removeAllRanges();
  selection?.addRange(range);

  try {
    const ok = document.execCommand("copy");
    if (!ok) {
      void navigator.clipboard?.writeText(plain);
    }
  } catch {
    void navigator.clipboard?.writeText(plain);
  } finally {
    selection?.removeAllRanges();
    document.body.removeChild(container);
  }
}

function stripTags(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
