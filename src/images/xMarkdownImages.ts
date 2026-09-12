import { App, TFile } from "obsidian";
import { isRemoteUrl } from "../parser/images";
import type { XImageRef, XImageUrlResolver } from "../renderer/xMarkdown";

/**
 * Build image URLs for X Markdown copy.
 * - Remote https → keep
 * - Local vault file + xImageBaseUrl → `${base}/${vaultPath}`
 * - Local without base → vault-relative path (flagged unresolved)
 */
export function createXMarkdownImageResolver(
  app: App,
  sourcePath: string,
  imageBaseUrl: string
): XImageUrlResolver {
  const base = (imageBaseUrl || "").trim().replace(/\/$/, "");

  return async (src, isLocal, alt): Promise<XImageRef> => {
    if (!src) {
      return { src, alt, url: "", localUnresolved: true };
    }

    // Keep real remote URLs; never put data:/blob: into X markdown.
    if (/^https?:\/\//i.test(src) || src.startsWith("//")) {
      const url = src.startsWith("//") ? `https:${src}` : src;
      return { src, alt, url, localUnresolved: false };
    }
    if (/^(data:|blob:)/i.test(src)) {
      return { src, alt, url: src, localUnresolved: true };
    }

    const looksLocal = isLocal || !isRemoteUrl(src);
    if (!looksLocal) {
      return { src, alt, url: src, localUnresolved: false };
    }

    const file = app.metadataCache.getFirstLinkpathDest(src, sourcePath);
    if (!(file instanceof TFile)) {
      return { src, alt, url: src, localUnresolved: true };
    }

    const vaultPath = file.path;
    if (base) {
      return {
        src,
        alt,
        url: joinUrl(base, vaultPath),
        localUnresolved: false,
      };
    }

    // Vault-relative path — valid Markdown, but X cannot fetch vault files.
    return {
      src,
      alt,
      url: encodePathSegments(vaultPath),
      localUnresolved: true,
    };
  };
}

function joinUrl(base: string, vaultPath: string): string {
  return `${base}/${encodePathSegments(vaultPath)}`;
}

function encodePathSegments(path: string): string {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}
