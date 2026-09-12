import { Notice, Plugin, WorkspaceLeaf, setIcon } from "obsidian";
import { copyActiveNote } from "./services/pipeline";
import { MarkPressSettingTab } from "./settings/SettingsTab";
import { DEFAULT_SETTINGS, type MarkPressSettings } from "./settings/store";
import type { SavedTheme } from "./themes/types";
import {
  MarkPressPreviewView,
  VIEW_TYPE_MARKPRESS_PREVIEW,
} from "./preview/PreviewView";

export default class MarkPressPlugin extends Plugin {
  settings: MarkPressSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(
      VIEW_TYPE_MARKPRESS_PREVIEW,
      (leaf) => new MarkPressPreviewView(leaf, this)
    );

    this.addRibbonIcon("book-open", "MarkPress Preview", () => {
      void this.activatePreviewView(true);
    });

    // Status bar — always visible quick open
    const status = this.addStatusBarItem();
    status.addClass("markpress-status-bar");
    status.setAttr("aria-label", "MarkPress Preview");
    status.setAttr("title", "MarkPress Preview");
    setIcon(status, "book-open");
    status.createSpan({ text: " MarkPress", cls: "markpress-status-bar-label" });
    status.addEventListener("click", () => {
      void this.activatePreviewView(true);
    });

    // No default hotkeys — users bind in Hotkeys settings (avoids conflicts).
    this.addCommand({
      id: "preview-current-note",
      name: "Preview Current Note",
      callback: () => {
        void this.activatePreviewView(true);
      },
    });

    this.addCommand({
      id: "open-preview",
      name: "Open Preview",
      callback: () => {
        void this.activatePreviewView(false);
      },
    });

    this.addCommand({
      id: "copy-current-note",
      name: "Copy for Current Platform",
      callback: () => {
        void this.copyCurrent();
      },
    });

    this.addCommand({
      id: "copy-as-rich-text",
      name: "Copy (WeChat rich text / X Markdown)",
      callback: () => {
        void this.copyCurrent();
      },
    });

    this.addSettingTab(new MarkPressSettingTab(this.app, this));
  }

  onunload(): void {
    // Do not detach leaves — preserves user sidebar placement across reloads.
  }

  async loadSettings(): Promise<void> {
    const raw = (await this.loadData()) as Record<string, unknown> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw || {});
    this.settings.overrides = this.settings.overrides || {};
    this.settings.savedThemes = this.settings.savedThemes || [];
    if (this.settings.themeId === "shadcn") {
      this.settings.themeId = "shadcn-zinc";
    }
    // Migrate legacy split preview/copy color modes → single colorMode
    const legacy = raw || {};
    if (!("colorMode" in legacy)) {
      const preview = legacy.previewColorMode;
      const copy = legacy.copyColorMode;
      if (copy === "dark" || preview === "dark") {
        this.settings.colorMode = "dark";
      } else {
        this.settings.colorMode = "light";
      }
    }
    if (this.settings.colorMode !== "dark") {
      this.settings.colorMode = "light";
    }
    if (this.settings.platform !== "x") {
      this.settings.platform = "wechat";
    }
    if (typeof this.settings.xImageBaseUrl !== "string") {
      this.settings.xImageBaseUrl = "";
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async saveCurrentAsTheme(name: string): Promise<void> {
    const now = Date.now();
    const saved: SavedTheme = {
      id: `custom-${now}`,
      name,
      baseThemeId: this.settings.themeId.startsWith("saved:")
        ? "default"
        : this.settings.themeId,
      overrides: { ...this.settings.overrides },
      customCss: this.settings.customCss,
      createdAt: now,
      updatedAt: now,
    };
    this.settings.savedThemes.push(saved);
    await this.saveSettings();
    new Notice(`Saved theme “${name}”`);
  }

  refreshOpenPreviews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MARKPRESS_PREVIEW)) {
      const view = leaf.view;
      if (view instanceof MarkPressPreviewView) {
        view.refreshThemeSelect();
        void view.renderPreview();
      }
    }
  }

  /** Place MarkPress in the right sidebar (icon strip) if missing. */
  async ensureRightSidebarLeaf(): Promise<WorkspaceLeaf | null> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_MARKPRESS_PREVIEW);
    if (existing.length) return existing[0];

    const leaf = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getRightLeaf(true);
    if (!leaf) return null;

    await leaf.setViewState({
      type: VIEW_TYPE_MARKPRESS_PREVIEW,
      active: false,
    });
    return leaf;
  }

  async activatePreviewView(forceRender = true): Promise<void> {
    const { workspace } = this.app;
    let leaf = await this.ensureRightSidebarLeaf();
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({
        type: VIEW_TYPE_MARKPRESS_PREVIEW,
        active: true,
      });
    }

    await workspace.revealLeaf(leaf);
    if (forceRender && leaf.view instanceof MarkPressPreviewView) {
      await leaf.view.renderPreview();
    }
  }

  private async copyCurrent(): Promise<void> {
    try {
      const result = await copyActiveNote(this.app, this.settings);
      if (result.platform === "x") {
        const n = result.unresolvedLocalCount || 0;
        if (n > 0) {
          new Notice(
            `Copied Markdown for X — ${n} local image(s) need a public URL (set X Image Base URL, or upload in X).`
          );
        } else {
          new Notice("Copied Markdown for X");
        }
      } else {
        new Notice("Copied for WeChat");
      }
    } catch (err) {
      console.error(err);
      new Notice(err instanceof Error ? err.message : "Copy failed");
    }
  }
}
