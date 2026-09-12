import { App, TFile } from "obsidian";
import { isRemoteUrl } from "../parser/images";
import type { ImageResolver } from "../renderer/wechat";

export interface ImageProcessOptions {
  mode: "preview" | "copy";
  optimize: boolean;
  maxWidth: number;
  jpegQuality: number;
}

export class VaultImageResolver implements ImageResolver {
  private blobUrls = new Set<string>();

  constructor(
    private app: App,
    private sourcePath: string,
    private options: ImageProcessOptions
  ) {}

  async resolve(src: string, isLocal?: boolean): Promise<string> {
    if (!src) return "";
    if (isRemoteUrl(src) || (!isLocal && /^(https?:|data:|blob:)/i.test(src))) {
      return src;
    }

    const file = this.app.metadataCache.getFirstLinkpathDest(src, this.sourcePath);
    if (!(file instanceof TFile)) {
      return src;
    }

    try {
      const buffer = await this.app.vault.readBinary(file);
      if (this.options.mode === "preview") {
        const blob = new Blob([buffer], { type: mimeFromExt(file.extension) });
        const url = URL.createObjectURL(blob);
        this.blobUrls.add(url);
        return url;
      }

      const optimized = this.options.optimize
        ? await optimizeImageBuffer(buffer, file.extension, this.options)
        : { buffer, mime: mimeFromExt(file.extension) };

      return arrayBufferToDataUrl(optimized.buffer, optimized.mime);
    } catch {
      return src;
    }
  }

  revoke(): void {
    for (const url of this.blobUrls) {
      URL.revokeObjectURL(url);
    }
    this.blobUrls.clear();
  }
}

function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "bmp":
      return "image/bmp";
    default:
      return "application/octet-stream";
  }
}

function arrayBufferToDataUrl(buffer: ArrayBuffer, mime: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

async function optimizeImageBuffer(
  buffer: ArrayBuffer,
  ext: string,
  options: ImageProcessOptions
): Promise<{ buffer: ArrayBuffer; mime: string }> {
  const mime = mimeFromExt(ext);
  if (mime === "image/svg+xml" || mime === "image/gif") {
    return { buffer, mime };
  }

  try {
    const blob = new Blob([buffer], { type: mime });
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, options.maxWidth / bitmap.width);
    if (scale >= 1 && buffer.byteLength < 400_000) {
      bitmap.close();
      return { buffer, mime };
    }

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = createEl("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return { buffer, mime };
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const hasAlpha = mime === "image/png";
    const outMime = hasAlpha ? "image/png" : "image/jpeg";
    const quality = hasAlpha ? undefined : options.jpegQuality;
    const outBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b: Blob | null) => resolve(b), outMime, quality)
    );
    if (!outBlob) return { buffer, mime };
    const outBuffer = await outBlob.arrayBuffer();
    return { buffer: outBuffer, mime: outMime };
  } catch {
    return { buffer, mime };
  }
}
