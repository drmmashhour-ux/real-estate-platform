/**
 * LECIPM Marketing Studio v1 — export Fabric canvas to raster (client-side only).
 */
import type { Canvas } from "fabric";

export type ExportFormat = "png" | "jpeg";

export function exportMarketingCanvasToDataUrl(
  canvas: Canvas,
  format: ExportFormat,
  opts?: { quality?: number; multiplier?: number }
): string {
  const multiplier = opts?.multiplier ?? 1;
  if (format === "png") {
    return canvas.toDataURL({ format: "png", multiplier });
  }
  return canvas.toDataURL({
    format: "jpeg",
    multiplier,
    quality: opts?.quality ?? 0.92,
  });
}

export function triggerDownloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
