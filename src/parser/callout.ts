export interface CalloutPlaceholder {
  kind: string;
  title?: string;
  body: string;
}

/**
 * Convert Obsidian callout blockquotes into placeholders so the markdown
 * parser can later expand them into Callout AST nodes.
 *
 * Example:
 * > [!NOTE] Title
 * > body line
 */
export function preprocessCallouts(markdown: string): {
  markdown: string;
  callouts: CalloutPlaceholder[];
} {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const callouts: CalloutPlaceholder[] = [];
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const header = line.match(/^>\s*\[!(\w+)\](?:\s+(.*))?$/i);
    if (!header) {
      out.push(line);
      i += 1;
      continue;
    }

    const kind = header[1].toLowerCase();
    const title = header[2]?.trim() || undefined;
    const bodyLines: string[] = [];
    i += 1;
    while (i < lines.length && /^>/.test(lines[i])) {
      bodyLines.push(lines[i].replace(/^>\s?/, ""));
      i += 1;
    }

    const idx = callouts.length;
    callouts.push({
      kind,
      title,
      body: bodyLines.join("\n").trim(),
    });
    out.push(`%%MARKPRESS_CALLOUT:${idx}%%`);
    out.push("");
  }

  return { markdown: out.join("\n"), callouts };
}
