"use client";

import * as React from "react";
import { triggerDownloadDataUrl } from "@/modules/marketing-studio/export.service";

const GOLD = "#C9A227";
const BLACK = "#0B0B0B";
const BOTTOM = 0.32;

type Props = {
  onExported?: (dataUrl: string) => void;
};

/**
 * v1: single canvas — upload an image, add headline + subline, black + gold LECIPM-style band, export PNG.
 * No external editor: pure canvas. Future: import layout tokens from the Fabric Marketing Studio.
 */
export function PosterEditor({ onExported }: Props) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const [headline, setHeadline] = React.useState("Headline in gold");
  const [subline, setSubline] = React.useState("Subline — one clear value prop");
  const [branding, setBranding] = React.useState("LECIPM");
  const [fileName, setFileName] = React.useState<string | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const w = 1080;
  const h = 1920;
  const barH = Math.floor(h * BOTTOM);

  const redraw = React.useCallback(() => {
    const canvas = ref.current;
    const img = imgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, w, h);
    if (img?.complete && img.naturalWidth) {
      const topH = h - barH;
      const scale = Math.max(w / img.naturalWidth, topH / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const x = (w - dw) / 2;
      const y = (topH - dh) / 2;
      ctx.drawImage(img, x, y, dw, dh);
    }
    const y0 = h - barH;
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, y0, w, barH);
    ctx.strokeStyle = "rgba(201, 162, 39, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, y0);
    ctx.lineTo(w - 48, y0);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const pad = 48;
    ctx.font = "bold 56px system-ui, sans-serif";
    wrapText(ctx, headline, pad, y0 + 32, w - pad * 2, 64, 3);
    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.font = "32px system-ui, sans-serif";
    const subY = y0 + 32 + 64 * 2 + 8;
    wrapText(ctx, subline, pad, Math.min(subY, y0 + barH - 120), w - pad * 2, 40, 4);
    ctx.fillStyle = GOLD;
    ctx.font = "500 24px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(branding, w - pad, h - 40);
  }, [branding, headline, subline, barH, h, w]);

  React.useEffect(() => {
    redraw();
  }, [redraw]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const u = URL.createObjectURL(f);
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => {
      imgRef.current = i;
      URL.revokeObjectURL(u);
      redraw();
    };
    i.onerror = () => URL.revokeObjectURL(u);
    i.src = u;
  };

  const onExport = () => {
    const canvas = ref.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png", 0.95);
    triggerDownloadDataUrl(dataUrl, "lecipm-poster.png");
    onExported?.(dataUrl);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-sm text-zinc-300">
            Background image
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-zinc-400 file:mr-2 file:rounded file:border-0 file:bg-amber-900/40 file:px-3 file:py-1.5"
              onChange={onFile}
            />
          </label>
          {fileName ? <p className="text-xs text-zinc-500">Loaded: {fileName}</p> : null}
          <label className="block text-sm text-zinc-300">
            Headline
            <input
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </label>
          <label className="block text-sm text-zinc-300">
            Subline
            <textarea
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              rows={2}
              value={subline}
              onChange={(e) => setSubline(e.target.value)}
            />
          </label>
          <label className="block text-sm text-zinc-300">
            Branding line
            <input
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
              value={branding}
              onChange={(e) => setBranding(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={onExport}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
          >
            Export PNG
          </button>
        </div>
        <div className="flex justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-2">
          <div className="max-h-[min(80vh,960px)] w-full max-w-sm overflow-auto">
            <canvas
              ref={ref}
              width={w}
              height={h}
              className="h-auto w-full max-w-full rounded-lg border border-zinc-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/);
  let line = "";
  let yy = y;
  let n = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line, x, yy);
      line = words[i] + " ";
      yy += lineHeight;
      n++;
      if (n >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (n < maxLines) ctx.fillText(line, x, yy);
}
