import { App, MarkdownView, TFile } from "obsidian";
import { copyRichText } from "../clipboard/copyWechat";
import { VaultImageResolver } from "../images/resolver";
import { parseMarkdown } from "../parser/markdown";
import { renderWeChatHtml, renderWeChatPlainText } from "../renderer/wechat";
import type { MarkPressSettings } from "../settings/store";
import { resolveTheme } from "../themes";
import type { ThemeOverrides } from "../themes/types";

/**
 * Build HTML for preview or copy.
 * Styles are identical; only image embedding differs (blob vs base64).
 */
export async function buildWeChatHtml(
  app: App,
  file: TFile,
  settings: MarkPressSettings,
  mode: "preview" | "copy"
): Promise<{ html: string; plain: string; resolver: VaultImageResolver; colorScheme: "light" | "dark" }> {
  const markdown = await app.vault.cachedRead(file);
  const doc = parseMarkdown(markdown);

  const { themeId, overrides, customCss } = resolveSettingsTheme(settings);
  const colorScheme = settings.colorMode === "dark" ? "dark" : "light";

  const theme = resolveTheme({
    themeId,
    globalOverrides: overrides,
    customCss,
    documentOverrides: doc.meta.wechat,
    colorScheme,
  });

  const resolver = new VaultImageResolver(app, file.path, {
    mode,
    optimize: settings.optimizeImages,
    maxWidth: settings.imageMaxWidth,
    jpegQuality: settings.jpegQuality,
  });

  const html = await renderWeChatHtml(doc, {
    theme,
    imageResolver: resolver,
    mode,
  });
  const plain = renderWeChatPlainText(doc);
  return { html, plain, resolver, colorScheme };
}

function resolveSettingsTheme(settings: MarkPressSettings): {
  themeId: string;
  overrides: ThemeOverrides;
  customCss: string;
} {
  if (settings.themeId.startsWith("saved:")) {
    const id = settings.themeId.slice("saved:".length);
    const saved = settings.savedThemes.find((t) => t.id === id);
    if (saved) {
      return {
        themeId: saved.baseThemeId,
        overrides: { ...saved.overrides, ...settings.overrides },
        customCss: settings.customCss || saved.customCss || "",
      };
    }
  }
  return {
    themeId: settings.themeId,
    overrides: settings.overrides,
    customCss: settings.customCss,
  };
}

export function getActiveMarkdownFile(app: App): TFile | null {
  const active = app.workspace.getActiveViewOfType(MarkdownView);
  if (active?.file) return active.file;

  const leaves = app.workspace.getLeavesOfType("markdown");
  for (const leaf of leaves) {
    const view = leaf.view;
    if (view instanceof MarkdownView && view.file) {
      return view.file;
    }
  }

  return null;
}

export function resolveMarkdownFile(app: App, preferred: TFile | null): TFile | null {
  if (preferred) {
    const stillOpen = app.workspace
      .getLeavesOfType("markdown")
      .some(
        (leaf) =>
          leaf.view instanceof MarkdownView && leaf.view.file?.path === preferred.path
      );
    if (stillOpen || app.vault.getAbstractFileByPath(preferred.path) instanceof TFile) {
      const active = app.workspace.getActiveViewOfType(MarkdownView);
      if (active?.file) return active.file;
      return preferred;
    }
  }
  return getActiveMarkdownFile(app);
}

export async function copyActiveNote(
  app: App,
  settings: MarkPressSettings,
  preferredFile?: TFile | null
): Promise<void> {
  const file = preferredFile ?? getActiveMarkdownFile(app);
  if (!file) {
    throw new Error("No active Markdown note");
  }
  const { html, plain, resolver } = await buildWeChatHtml(app, file, settings, "copy");
  try {
    await copyRichText(html, plain);
  } finally {
    resolver.revoke();
  }
}
