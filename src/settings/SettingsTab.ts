import { App, PluginSettingTab, Setting } from "obsidian";
import type MarkPressPlugin from "../main";
import { listBuiltinThemes } from "../themes";
import { HEADING_VARIANTS } from "./store";
import type { HeadingVariant } from "../themes/types";

export class MarkPressSettingTab extends PluginSettingTab {
  plugin: MarkPressPlugin;

  constructor(app: App, plugin: MarkPressPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Default platform")
      .setDesc("WeChat = themed HTML copy. X Article = native Markdown copy.")
      .addDropdown((dropdown) => {
        dropdown.addOption("wechat", "WeChat");
        dropdown.addOption("x", "X Article");
        dropdown.setValue(this.plugin.settings.platform || "wechat");
        dropdown.onChange(async (value) => {
          this.plugin.settings.platform = value === "x" ? "x" : "wechat";
          await this.plugin.saveSettings();
          this.plugin.refreshOpenPreviews();
        });
      });

    new Setting(containerEl)
      .setName("Default theme")
      .setDesc(
        "Publish palette for WeChat output. Colors are fixed hex values — not tied to your Obsidian theme."
      )
      .addDropdown((dropdown) => {
        for (const theme of listBuiltinThemes()) {
          dropdown.addOption(theme.id, theme.name);
        }
        const current =
          this.plugin.settings.themeId === "shadcn"
            ? "shadcn-zinc"
            : this.plugin.settings.themeId;
        dropdown.setValue(current);
        dropdown.onChange(async (value) => {
          this.plugin.settings.themeId = value;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenPreviews();
        });
      });

    new Setting(containerEl).setName("X Article").setHeading();

    new Setting(containerEl)
      .setName("X image base URL")
      .setDesc(
        "Public CDN/prefix for vault images when copying Markdown for X. Example: https://cdn.example.com/vault — then ![[a.png]] becomes that URL + vault path. Leave empty to keep relative paths (X cannot load vault files)."
      )
      .addText((text) => {
        text
          .setPlaceholder("https://…")
          .setValue(this.plugin.settings.xImageBaseUrl || "");
        text.onChange(async (value) => {
          this.plugin.settings.xImageBaseUrl = value.trim();
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl).setName("Color mode").setHeading();

    new Setting(containerEl)
      .setName("Article color mode")
      .setDesc(
        "Light / Dark for BOTH preview and copy (same HTML). Independent of Obsidian theme. Prefer Light for WeChat."
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("light", "Light");
        dropdown.addOption("dark", "Dark");
        dropdown.setValue(this.plugin.settings.colorMode || "light");
        dropdown.onChange(async (value) => {
          this.plugin.settings.colorMode = value as "light" | "dark";
          await this.plugin.saveSettings();
          this.plugin.refreshOpenPreviews();
        });
      });

    new Setting(containerEl).setName("Typography").setHeading();

    this.addColor("Primary color", "primaryColor");
    this.addColor("Text color", "textColor");
    this.addNumber("Font size", "fontSize", 12, 28, 1);
    new Setting(containerEl)
      .setName("Line height")
      .setDesc(
        "Recommended 1.75 for Chinese body text on both desktop and mobile (comfortable range 1.7–1.8)."
      )
      .addText((text) => {
        const current = this.plugin.settings.overrides.lineHeight;
        text.setPlaceholder("1.75");
        text.setValue(current == null ? "" : String(current));
        text.onChange(async (value) => {
          if (!value.trim()) {
            delete this.plugin.settings.overrides.lineHeight;
          } else {
            const n = Number(value);
            if (!Number.isFinite(n) || n < 1.2 || n > 2.5) return;
            this.plugin.settings.overrides.lineHeight = n;
          }
          await this.plugin.saveSettings();
          this.plugin.refreshOpenPreviews();
        });
      });
    this.addNumber("Letter spacing", "letterSpacing", 0, 2, 0.1);
    this.addNumber("Paragraph spacing", "paragraphMarginBottom", 0, 40, 1);
    this.addNumber("Max width", "maxWidth", 400, 900, 10);

    new Setting(containerEl).setName("Headings").setHeading();
    this.addHeadingVariant("H1 style", "h1Variant");
    this.addHeadingVariant("H2 style", "h2Variant");
    this.addHeadingVariant("H3 style", "h3Variant");

    new Setting(containerEl).setName("Blocks").setHeading();
    this.addColor("Quote background", "quoteBackground");
    this.addColor("Code background", "codeBackground");
    this.addColor("Link color", "linkColor");
    this.addNumber("Image border radius", "imageBorderRadius", 0, 24, 1);

    new Setting(containerEl).setName("Images").setHeading();
    new Setting(containerEl)
      .setName("Optimize images before copying")
      .setDesc("Resize large local images and re-encode before Base64 embedding.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.optimizeImages);
        toggle.onChange(async (value) => {
          this.plugin.settings.optimizeImages = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Max width")
      .setDesc("Maximum width in pixels when optimizing images.")
      .addText((text) => {
        text.setValue(String(this.plugin.settings.imageMaxWidth));
        text.onChange(async (value) => {
          const n = Number(value);
          if (!Number.isFinite(n) || n <= 0) return;
          this.plugin.settings.imageMaxWidth = n;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("JPEG quality")
      .setDesc("0.1 – 1.0")
      .addText((text) => {
        text.setValue(String(this.plugin.settings.jpegQuality));
        text.onChange(async (value) => {
          const n = Number(value);
          if (!Number.isFinite(n) || n <= 0 || n > 1) return;
          this.plugin.settings.jpegQuality = n;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl).setName("Advanced").setHeading();
    new Setting(containerEl)
      .setName("Custom CSS")
      .setDesc(
        "Override known selectors (p, h1–h6, blockquote, pre, a, img, hr, table). Computed into inline styles — never copied as a <style> block."
      )
      .addTextArea((area) => {
        area.setPlaceholder("h2 { color: #222; border-left: 4px solid #625fff; }");
        area.setValue(this.plugin.settings.customCss);
        area.inputEl.rows = 8;
        area.inputEl.addClass("markpress-custom-css");
        area.onChange(async (value) => {
          this.plugin.settings.customCss = value;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenPreviews();
        });
      });

    new Setting(containerEl)
      .setName("Save theme as…")
      .setDesc("Persist current overrides as a named custom theme in plugin data.")
      .addText((text) => {
        text.setPlaceholder("My WeChat");
        text.inputEl.dataset.role = "save-theme-name";
      })
      .addButton((btn) => {
        btn.setButtonText("Save");
        btn.onClick(async () => {
          const input = containerEl.querySelector(
            'input[data-role="save-theme-name"]'
          );
          if (!(input instanceof HTMLInputElement)) return;
          const name = input.value.trim();
          if (!name) return;
          await this.plugin.saveCurrentAsTheme(name);
          input.value = "";
          this.display();
        });
      });

    if (this.plugin.settings.savedThemes.length) {
      new Setting(containerEl).setName("Saved themes").setHeading();
      for (const saved of this.plugin.settings.savedThemes) {
        new Setting(containerEl)
          .setName(saved.name)
          .setDesc(`Based on ${saved.baseThemeId}`)
          .addButton((btn) => {
            btn.setButtonText("Apply");
            btn.onClick(async () => {
              this.plugin.settings.themeId = saved.baseThemeId;
              this.plugin.settings.overrides = { ...saved.overrides };
              this.plugin.settings.customCss = saved.customCss || "";
              await this.plugin.saveSettings();
              this.plugin.refreshOpenPreviews();
              this.display();
            });
          })
          .addButton((btn) => {
            btn.setButtonText("Delete");
            btn.onClick(async () => {
              this.plugin.settings.savedThemes = this.plugin.settings.savedThemes.filter(
                (t) => t.id !== saved.id
              );
              await this.plugin.saveSettings();
              this.display();
            });
          });
      }
    }

    new Setting(containerEl)
      .setName("Reset style overrides")
      .addButton((btn) => {
        btn.setButtonText("Reset");
        btn.onClick(async () => {
          this.plugin.settings.overrides = {};
          this.plugin.settings.customCss = "";
          await this.plugin.saveSettings();
          this.plugin.refreshOpenPreviews();
          this.display();
        });
      });
  }

  private addColor(name: string, key: keyof MarkPressPlugin["settings"]["overrides"]): void {
    const current = (this.plugin.settings.overrides[key] as string) || "";
    new Setting(this.containerEl)
      .setName(name)
      .addText((text) => {
        text.setPlaceholder("#625fff");
        text.setValue(current);
        text.onChange(async (value) => {
          const v = value.trim();
          if (!v) delete this.plugin.settings.overrides[key];
          else (this.plugin.settings.overrides as Record<string, unknown>)[key] = v;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenPreviews();
        });
      });
  }

  private addNumber(
    name: string,
    key: keyof MarkPressPlugin["settings"]["overrides"],
    min: number,
    max: number,
    step: number
  ): void {
    const current = this.plugin.settings.overrides[key];
    new Setting(this.containerEl)
      .setName(name)
      .addText((text) => {
        text.setPlaceholder(`${min} – ${max}`);
        text.setValue(current == null ? "" : String(current));
        text.onChange(async (value) => {
          if (!value.trim()) {
            delete this.plugin.settings.overrides[key];
          } else {
            const n = Number(value);
            if (!Number.isFinite(n) || n < min || n > max) return;
            (this.plugin.settings.overrides as Record<string, unknown>)[key] =
              step < 1 ? n : Math.round(n);
          }
          await this.plugin.saveSettings();
          this.plugin.refreshOpenPreviews();
        });
      });
  }

  private addHeadingVariant(
    name: string,
    key: "h1Variant" | "h2Variant" | "h3Variant"
  ): void {
    new Setting(this.containerEl)
      .setName(name)
      .addDropdown((dropdown) => {
        for (const v of HEADING_VARIANTS) dropdown.addOption(v.id, v.label);
        dropdown.setValue(this.plugin.settings.overrides[key] || "plain");
        dropdown.onChange(async (value) => {
          this.plugin.settings.overrides[key] = value as HeadingVariant;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenPreviews();
        });
      });
  }
}
