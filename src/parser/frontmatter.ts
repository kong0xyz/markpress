/**
 * Minimal frontmatter parser (no gray-matter / js-yaml).
 * Supports flat keys and one level of nesting (e.g. wechat:).
 */
export function parseFrontmatter(source: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const text = source || "";
  if (!text.startsWith("---")) {
    return { data: {}, content: text };
  }

  const end = text.indexOf("\n---", 3);
  if (end < 0) {
    return { data: {}, content: text };
  }

  const raw = text.slice(3, end).replace(/^\r?\n/, "");
  const content = text.slice(end + 4).replace(/^\r?\n/, "");
  return { data: parseSimpleYaml(raw), content };
}

function parseSimpleYaml(raw: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  let currentMap: Record<string, unknown> | null = null;
  let currentKey = "";

  const lines: string[] = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Nested under a map key: two spaces or one tab.
    const nested = /^(?: {2}|\t)([\w-]+)\s*:\s*(.*)$/.exec(line);
    if (nested && currentMap) {
      currentMap[nested[2]] = coerceScalar(nested[3]);
      continue;
    }

    const top = /^([\w-]+)\s*:\s*(.*)$/.exec(line);
    if (!top) continue;

    const key = top[1];
    const value = top[2].trim();
    if (value === "") {
      currentMap = {};
      currentKey = key;
      root[key] = currentMap;
    } else {
      currentMap = null;
      currentKey = "";
      root[key] = coerceScalar(value);
    }
  }

  void currentKey;
  return root;
}

function coerceScalar(raw: string): string | number | boolean {
  const v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}
