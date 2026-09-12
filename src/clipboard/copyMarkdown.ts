/** Copy plain Markdown for X Articles (Clipboard API only). */
export async function copyMarkdown(markdown: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API unavailable");
  }
  await navigator.clipboard.writeText(markdown);
}
