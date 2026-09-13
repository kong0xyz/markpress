import {
  ItemView,
  MarkdownView,
  TFile,
  WorkspaceLeaf,
  Notice,
  setIcon,
} from "obsidian";
import type { App } from "obsidian";
import type MarkPressPlugin from "../main";
import {
  buildWeChatHtml,
  buildXPreview,
  copyActiveNote,
  resolveMarkdownFile,
} from "../services/pipeline";
import { listBuiltinThemes } from "../themes";
import type { PublishPlatform } from "../settings/store";
import { PUBLISH_PLATFORMS } from "../settings/store";

export const VIEW_TYPE_MARKPRESS_PREVIEW = "markpress-wechat-preview";

export class MarkPressPreviewView extends ItemView {
  plugin: MarkPressPlugin;
  private platformSelectEl: HTMLSelectElement | null = null;
  private themeSelectEl: HTMLSelectElement | null = null;
  private colorModeEl: HTMLSelectElement | null = null;
  private wechatControlsEl: HTMLElement | null = null;
  private copyBtnEl: HTMLButtonElement | null = null;
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
    return "MarkPress";
  }

  getIcon(): string {
    return "book-open";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("markpress-preview-view");

    const toolbar = container.createDiv({ cls: "markpress-toolbar" });

    this.platformSelectEl = toolbar.createEl("select", { cls: "markpress-platform-select" });
    this.platformSelectEl.setAttr("aria-label", "Platform");
    for (const p of PUBLISH_PLATFORMS) {
      this.platformSelectEl.createEl("option", { text: p.label, value: p.id });
    }
    this.platformSelectEl.value = this.plugin.settings.platform || "wechat";
    this.platformSelectEl.addEventListener("change", () => {
      void (async () => {
        this.plugin.settings.platform = this.platformSelectEl!.value as PublishPlatform;
        await this.plugin.saveSettings();
        this.syncPlatformChrome();
        await this.renderPreview();
      })();
    });

    this.wechatControlsEl = toolbar.createDiv({ cls: "markpress-wechat-controls" });

    this.themeSelectEl = this.wechatControlsEl.createEl("select", {
      cls: "markpress-theme-select",
    });
    this.themeSelectEl.setAttr("aria-label", "Theme");
    this.populateThemes();
    this.themeSelectEl.value = this.plugin.settings.themeId;
    this.themeSelectEl.addEventListener("change", () => {
      void (async () => {
        this.plugin.settings.themeId = this.themeSelectEl!.value;
        await this.plugin.saveSettings();
        await this.renderPreview();
      })();
    });

    this.colorModeEl = this.wechatControlsEl.createEl("select", {
      cls: "markpress-color-mode",
    });
    this.colorModeEl.setAttr("aria-label", "Color mode");
    this.colorModeEl.createEl("option", { text: "Light", value: "light" });
    this.colorModeEl.createEl("option", { text: "Dark", value: "dark" });
    this.colorModeEl.value = this.plugin.settings.colorMode || "light";
    this.colorModeEl.addEventListener("change", () => {
      void (async () => {
        this.plugin.settings.colorMode = this.colorModeEl!.value as "light" | "dark";
        await this.plugin.saveSettings();
        await this.renderPreview();
      })();
    });

    const customizeBtn = toolbar.createEl("button", {
      cls: "markpress-icon-btn",
      attr: { "aria-label": "Customize", title: "Customize" },
    });
    setIcon(customizeBtn, "settings");
    customizeBtn.addEventListener("click", () => {
      const appWithSetting = this.app as App & {
        setting?: { open: () => void; openTabById: (id: string) => void };
      };
      appWithSetting.setting?.open();
      appWithSetting.setting?.openTabById("markpress");
    });

    toolbar.createDiv({ cls: "spacer" });
    this.statusEl = toolbar.createDiv({ cls: "markpress-status" });

    this.copyBtnEl = toolbar.createEl("button", { text: "Copy", cls: "mod-cta" });
    this.copyBtnEl.addEventListener("click", () => {
      void (async () => {
        try {
          const file = resolveMarkdownFile(this.app, this.sourceFile);
          const result = await copyActiveNote(this.app, this.plugin.settings, file);
          if (result.platform === "x") {
            const n = result.unresolvedLocalCount || 0;
            if (n > 0) {
              new Notice(
                `Copied Markdown for X — ${n} local image(s) need a public URL (set X Image Base URL in settings, or upload in X).`
              );
            } else {
              new Notice("Copied Markdown for X");
            }
            this.setStatus(n > 0 ? `Copied · ${n} local img` : "Copied");
          } else {
            new Notice("Copied for WeChat");
            this.setStatus("Copied");
          }
        } catch (err) {
          console.error(err);
          new Notice("Copy failed");
          this.setStatus("Copy failed", true);
        }
      })();
    });

    const scroll = container.createDiv({ cls: "markpress-preview-scroll" });
    this.previewFrameEl = scroll.createDiv({ cls: "markpress-preview-frame" });
    this.previewFrameEl.createDiv({
      cls: "markpress-empty",
      text: "Open a Markdown note to preview.",
    });

    this.syncPlatformChrome();
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
    if (this.platformSelectEl) {
      this.platformSelectEl.value = this.plugin.settings.platform || "wechat";
    }
    this.syncPlatformChrome();
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
    const platform = this.plugin.settings.platform === "x" ? "x" : "wechat";

    try {
      this.currentResolver?.revoke();
      this.previewFrameEl.empty();

      if (platform === "x") {
        const { html, resolver } = await buildXPreview(this.app, file, this.plugin.settings);
        this.currentResolver = resolver;
        this.previewFrameEl.toggleClass("is-dark", false);
        this.previewFrameEl.toggleClass("is-light", true);
        this.previewFrameEl.toggleClass("is-x", true);

        this.previewFrameEl.createDiv({
          cls: "markpress-preview-meta",
          text: `${file.basename} · X Article`,
        });

        this.shadowHostEl = this.previewFrameEl.createDiv({ cls: "markpress-shadow-host" });
        this.mountShadowPreview(this.shadowHostEl, html);
      } else {
        const { html, resolver, colorScheme } = await buildWeChatHtml(
          this.app,
          file,
          this.plugin.settings,
          "preview"
        );
        this.currentResolver = resolver;
        this.previewFrameEl.toggleClass("is-dark", colorScheme === "dark");
        this.previewFrameEl.toggleClass("is-light", colorScheme === "light");
        this.previewFrameEl.toggleClass("is-x", false);

        this.previewFrameEl.createDiv({
          cls: "markpress-preview-meta",
          text: `${file.basename} · WeChat`,
        });

        this.shadowHostEl = this.previewFrameEl.createDiv({ cls: "markpress-shadow-host" });
        this.mountShadowPreview(this.shadowHostEl, html);
      }

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

  /**
   * Mount themed HTML into Shadow DOM (isolates Obsidian theme CSS).
   * No <style> tags — plugin CSS must live in styles.css; preview HTML uses inline styles.
   */
  private mountShadowPreview(host: HTMLElement, html: string): void {
    const shadow = host.attachShadow({ mode: "open" });
    const root = createEl("div", { cls: "markpress-shadow-root" });
    root.detach();

    const parsed = new DOMParser().parseFromString(
      `<div id="markpress-shadow-root">${html}</div>`,
      "text/html"
    );
    const source = parsed.getElementById("markpress-shadow-root");
    if (source) {
      // importNode clones and does NOT detach — iterate a snapshot, not while(firstChild).
      for (const child of Array.from(source.childNodes)) {
        root.appendChild(document.importNode(child, true));
      }
    }
    shadow.appendChild(root);
  }

  private syncPlatformChrome(): void {
    const platform = this.plugin.settings.platform === "x" ? "x" : "wechat";
    this.wechatControlsEl?.toggleClass("is-hidden", platform === "x");
    if (this.copyBtnEl) {
      this.copyBtnEl.setText(platform === "x" ? "Copy Markdown" : "Copy for WeChat");
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
