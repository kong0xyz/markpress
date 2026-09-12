/** Copy plain Markdown for X Articles (text/plain only). */
export async function copyMarkdown(markdown: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(markdown);
      return;
    } catch {
      // fall through
    }
  }

  const ta = document.createElement("textarea");
  ta.value = markdown;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(ta);
  }
}
