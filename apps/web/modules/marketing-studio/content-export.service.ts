import type { ContentExportBundle, ExportKind, MarketingContentItem, VideoProject } from "./content.types";
import { toVideoRenderPayload } from "./video.service";
import { triggerDownloadDataUrl } from "./export.service";

function blobUrlFromText(body: string, mime: string): string {
  if (typeof Blob === "undefined") return "";
  return URL.createObjectURL(new Blob([body], { type: mime }));
}

export function buildExportBundle(
  item: MarketingContentItem,
  kind: ExportKind,
  options?: { scriptText?: string; imageDataUrl?: string; videoProject?: VideoProject | null }
): ContentExportBundle {
  const base = `lecipm-${item.id.slice(0, 8)}`;
  if (kind === "script" || kind === "caption") {
    const text = (kind === "caption" && item.caption) || options?.scriptText || item.caption || "";
    return {
      contentId: item.id,
      kind,
      filename: `${base}-${kind}.txt`,
      mime: "text/plain;charset=utf-8",
      body: text,
    };
  }
  if (kind === "image" && options?.imageDataUrl) {
    // Store as "body" a note + data url length for testability; real download uses data URL
    return {
      contentId: item.id,
      kind: "image",
      filename: `${base}-poster.png`,
      mime: "image/png",
      body: options.imageDataUrl,
    };
  }
  if (kind === "video_json" && options?.videoProject) {
    const body = JSON.stringify(toVideoRenderPayload(options.videoProject), null, 2);
    return {
      contentId: item.id,
      kind: "video_json",
      filename: `${base}-video-storyboard.json`,
      mime: "application/json;charset=utf-8",
      body,
    };
  }
  return {
    contentId: item.id,
    kind,
    filename: `${base}-export.txt`,
    mime: "text/plain;charset=utf-8",
    body: `No export data for kind ${kind}. Link a video project or script first.`,
  };
}

/** Browser: trigger download. No-op in Node if blob unsupported. */
export function downloadContentExportBundle(bundle: ContentExportBundle) {
  if (bundle.kind === "image" && bundle.body.startsWith("data:")) {
    triggerDownloadDataUrl(bundle.body, bundle.filename);
    return;
  }
  const url = blobUrlFromText(bundle.body, bundle.mime);
  if (!url || typeof document === "undefined") return;
  const a = document.createElement("a");
  a.href = url;
  a.download = bundle.filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}
