import { ItemView, MarkdownView, TFile, WorkspaceLeaf, Notice, setIcon } from "obsidian";
import type MarkPressPlugin from "../main";
import {
  buildWeChatHtml,
  copyActiveNote,
  resolveMarkdownFile,
} from "../services/pipeline";
import { listBuiltinThemes } from "../themes";

export const VIEW_TYPE_MARKPRESS_PREVIEW = "markpress-wechat-preview";

export class MarkPressPreviewView extends ItemView {
  plugin: MarkPressPlugin;
  private themeSelectEl: HTMLSelectElement | null = null;
  private colorModeEl: HTMLSelectElement | null = null;
  private previewFrameEl: HTMLElement | null = null;
  private shadowHostEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private debounceTimer: number | null = null;
  private currentResolver: { revoke: () => void } | null = null;
  private sourceFile: TFile | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: MarkPressPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_MARKPRESS_PREVIEW;
  }

  getDisplayText(): string {
    return "WeChat Preview";
  }

  getIcon(): string {
    return "book-open";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("markpress-preview-view");

    const toolbar = container.createDiv({ cls: "markpress-toolbar" });

    this.themeSelectEl = toolbar.createEl("select", { cls: "markpress-theme-select" });
    this.themeSelectEl.setAttr("aria-label", "Theme");
    this.populateThemes();
    this.themeSelectEl.value = this.plugin.settings.themeId;
    this.themeSelectEl.addEventListener("change", async () => {
      this.plugin.settings.themeId = this.themeSelectEl!.value;
      await this.plugin.saveSettings();
      await this.renderPreview();
    });

    this.colorModeEl = toolbar.createEl("select", { cls: "markpress-color-mode" });
    this.colorModeEl.setAttr("aria-label", "Color mode");
    this.colorModeEl.createEl("option", { text: "Light", value: "light" });
    this.colorModeEl.createEl("option", { text: "Dark", value: "dark" });
    this.colorModeEl.value = this.plugin.settings.colorMode || "light";
    this.colorModeEl.addEventListener("change", async () => {
      this.plugin.settings.colorMode = this.colorModeEl!.value as "light" | "dark";
      await this.plugin.saveSettings();
      await this.renderPreview();
    });

    const customizeBtn = toolbar.createEl("button", {
      cls: "markpress-icon-btn",
      attr: { "aria-label": "Customize", title: "Customize" },
    });
    setIcon(customizeBtn, "settings");
    customizeBtn.addEventListener("click", () => {
      // @ts-expect-error Obsidian internal API
      this.app.setting.open();
      // @ts-expect-error Obsidian internal API
      this.app.setting.openTabById("markpress");
    });

    toolbar.createDiv({ cls: "spacer" });
    this.statusEl = toolbar.createDiv({ cls: "markpress-status" });

    const copyBtn = toolbar.createEl("button", { text: "Copy for WeChat", cls: "mod-cta" });
    copyBtn.addEventListener("click", async () => {
      try {
        const file = resolveMarkdownFile(this.app, this.sourceFile);
        await copyActiveNote(this.app, this.plugin.settings, file);
        new Notice("Copied for WeChat");
        this.setStatus("Copied");
      } catch (err) {
        console.error(err);
        new Notice("Copy failed");
        this.setStatus("Copy failed", true);
      }
    });

    const scroll = container.createDiv({ cls: "markpress-preview-scroll" });
    this.previewFrameEl = scroll.createDiv({ cls: "markpress-preview-frame" });
    this.previewFrameEl.createDiv({
      cls: "markpress-empty",
      text: "Open a Markdown note to preview.",
    });

    this.registerWorkspaceEvents();
    await this.renderPreview();
  }

  async onClose(): Promise<void> {
    if (this.debounceTimer != null) window.clearTimeout(this.debounceTimer);
    this.currentResolver?.revoke();
  }

  refreshThemeSelect(): void {
    if (!this.themeSelectEl) return;
    this.populateThemes();
    this.themeSelectEl.value = this.plugin.settings.themeId;
    if (this.colorModeEl) {
      this.colorModeEl.value = this.plugin.settings.colorMode || "light";
    }
  }

  scheduleRender(): void {
    if (this.debounceTimer != null) window.clearTimeout(this.debounceTimer);
    const ms = this.plugin.settings.previewDebounceMs || 300;
    this.debounceTimer = window.setTimeout(() => {
      void this.renderPreview();
    }, ms);
  }

  async renderPreview(): Promise<void> {
    if (!this.previewFrameEl) return;

    const file = resolveMarkdownFile(this.app, this.sourceFile);
    if (!file) {
      this.sourceFile = null;
      this.shadowHostEl = null;
      this.previewFrameEl.empty();
      this.previewFrameEl.createDiv({
        cls: "markpress-empty",
        text: "Open a Markdown note to preview.",
      });
      this.setStatus("");
      return;
    }

    this.sourceFile = file;

    try {
      this.currentResolver?.revoke();
      // Same builder as Copy — only image mode differs (blob).
      const { html, resolver, colorScheme } = await buildWeChatHtml(
        this.app,
        file,
        this.plugin.settings,
        "preview"
      );
      this.currentResolver = resolver;
      this.previewFrameEl.empty();
      this.previewFrameEl.toggleClass("is-dark", colorScheme === "dark");
      this.previewFrameEl.toggleClass("is-light", colorScheme === "light");

      this.previewFrameEl.createDiv({
        cls: "markpress-preview-meta",
        text: file.basename,
      });

      // Shadow DOM: MarkPress HTML is isolated from Obsidian theme CSS.
      this.shadowHostEl = this.previewFrameEl.createDiv({ cls: "markpress-shadow-host" });
      const shadow = this.shadowHostEl.attachShadow({ mode: "open" });
      shadow.innerHTML = `<style>
        :host { display: block; }
        /* Reset inheritance from Obsidian without !important on content */
        :host, .root {
          all: initial;
          display: block;
          font-family: sans-serif;
        }
        .root { color: inherit; }
        img { max-width: 100%; }
      </style><div class="root">${html}</div>`;

      this.setStatus("");
    } catch (err) {
      console.error(err);
      this.shadowHostEl = null;
      this.previewFrameEl.empty();
      this.previewFrameEl.createDiv({
        cls: "markpress-empty",
        text: "Failed to render preview.",
      });
      this.setStatus("Render error", true);
    }
  }

  private populateThemes(): void {
    if (!this.themeSelectEl) return;
    this.themeSelectEl.empty();

    const shadcnGroup = this.themeSelectEl.createEl("optgroup", {
      attr: { label: "shadcn" },
    });
    const otherGroup = this.themeSelectEl.createEl("optgroup", {
      attr: { label: "Other" },
    });

    for (const theme of listBuiltinThemes()) {
      const parent = theme.id.startsWith("shadcn-") ? shadcnGroup : otherGroup;
      parent.createEl("option", {
        text: theme.name.replace(/^shadcn \/ /, ""),
        value: theme.id,
      });
    }
    for (const saved of this.plugin.settings.savedThemes) {
      otherGroup.createEl("option", {
        text: `${saved.name} (saved)`,
        value: `saved:${saved.id}`,
      });
    }
  }

  private setStatus(text: string, isError = false): void {
    if (!this.statusEl) return;
    this.statusEl.setText(text);
    this.statusEl.toggleClass("is-error", isError);
    this.statusEl.toggleClass("is-hidden", !text);
  }

  private registerWorkspaceEvents(): void {
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf?.view instanceof MarkPressPreviewView) {
          if (this.sourceFile) return;
        }
        this.scheduleRender();
      })
    );
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.sourceFile = file;
          this.scheduleRender();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        const target = resolveMarkdownFile(this.app, this.sourceFile);
        if (target && file.path === target.path) {
          this.scheduleRender();
        }
      })
    );
    this.registerEvent(
      this.app.workspace.on("editor-change", (_editor, view) => {
        if (view instanceof MarkdownView && view.file) {
          this.sourceFile = view.file;
          this.scheduleRender();
        }
      })
    );
  }
}
