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

    // Left ribbon
    this.addRibbonIcon("book-open", "MarkPress: WeChat Preview", () => {
      void this.activatePreviewView(true);
    });

    // Status bar — always visible quick open
    const status = this.addStatusBarItem();
    status.addClass("markpress-status-bar");
    status.setAttr("aria-label", "MarkPress WeChat Preview");
    status.setAttr("title", "MarkPress WeChat Preview (⌘⇧M)");
    setIcon(status, "book-open");
    status.createSpan({ text: " MarkPress", cls: "markpress-status-bar-label" });
    status.addEventListener("click", () => {
      void this.activatePreviewView(true);
    });

    this.addCommand({
      id: "preview-current-note",
      name: "WeChat: Preview Current Note",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "M" }],
      callback: () => {
        void this.activatePreviewView(true);
      },
    });

    this.addCommand({
      id: "open-preview",
      name: "WeChat: Open Preview",
      callback: () => {
        void this.activatePreviewView(false);
      },
    });

    this.addCommand({
      id: "copy-current-note",
      name: "WeChat: Copy Current Note",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "C" }],
      callback: () => {
        void this.copyCurrent();
      },
    });

    this.addCommand({
      id: "copy-as-rich-text",
      name: "WeChat: Copy as Rich Text",
      callback: () => {
        void this.copyCurrent();
      },
    });

    this.addSettingTab(new MarkPressSettingTab(this.app, this));

    // Keep a tab icon in the right sidebar so preview is one click away.
    this.app.workspace.onLayoutReady(() => {
      void this.ensureRightSidebarLeaf();
    });
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MARKPRESS_PREVIEW);
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

    // Expand right sidebar so the preview is visible.
    const rightSplit = (workspace as unknown as { rightSplit?: { expand?: () => void } })
      .rightSplit;
    rightSplit?.expand?.();

    workspace.revealLeaf(leaf);
    if (forceRender && leaf.view instanceof MarkPressPreviewView) {
      await leaf.view.renderPreview();
    }
  }

  private async copyCurrent(): Promise<void> {
    try {
      await copyActiveNote(this.app, this.settings);
      new Notice("Copied for WeChat");
    } catch (err) {
      console.error(err);
      new Notice(err instanceof Error ? err.message : "Copy failed");
    }
  }
}
