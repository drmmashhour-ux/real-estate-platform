"use client";

/**
 * LECIPM Marketing Studio v1 — Fabric.js canvas (client-only).
 */
import * as React from "react";
import {
  Canvas as FabricCanvas,
  Circle,
  FabricImage,
  FabricText,
  IText,
  Line,
  Rect,
  ActiveSelection,
  filters,
  Shadow,
} from "fabric";
import type { FabricObject } from "fabric";
import { exportMarketingCanvasToDataUrl, type ExportFormat } from "@/modules/marketing-studio/export.service";
import {
  applyMarketingTemplate,
  type MarketingTemplateId,
} from "@/modules/marketing-studio/templates/index";

export type EditorCanvasHandle = {
  getCanvas: () => FabricCanvas | null;
  addText: () => void;
  addRect: () => void;
  addCircle: () => void;
  addLine: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackwards: () => void;
  undo: () => void;
  redo: () => void;
  loadFromObject: (data: object) => Promise<void>;
  getProjectData: () => object;
  applyImageFromFile: (file: File) => void;
  setImageBrightnessContrast: (brightness: number, contrast: number) => void;
  setTextStyle: (partial: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    fill?: string;
    textAlign?: "left" | "center" | "right" | "justify";
    shadow?: { color: string; blur: number; offsetX: number; offsetY: number } | null;
  }) => void;
  exportDataUrl: (format: ExportFormat) => string | null;
  applyTemplate: (templateId: MarketingTemplateId) => void;
  /** Places generated copy as editable text blocks (does not clear canvas). */
  placeAiMarketingBlocks: (blocks: {
    headline: string;
    subhead: string;
    cta: string;
    body: string;
    hashtags: string[];
  }) => void;
  setSelectedOpacity: (opacity: number) => void;
  setSelectedFill: (fill: string) => void;
  setSelectedStroke: (stroke: string) => void;
};

export type EditorCanvasProps = {
  width?: number;
  height?: number;
  onReady?: (api: EditorCanvasHandle) => void;
  onSelectionChange?: (obj: FabricObject | null) => void;
};

const DEFAULT_W = 1080;
const DEFAULT_H = 1080;
const MAX_HIST = 30;

export function EditorCanvas({
  width = DEFAULT_W,
  height = DEFAULT_H,
  onReady,
  onSelectionChange,
}: EditorCanvasProps) {
  const canvasElRef = React.useRef<HTMLCanvasElement>(null);
  const fabricRef = React.useRef<FabricCanvas | null>(null);
  const historyRef = React.useRef<string[]>([]);
  const futureRef = React.useRef<string[]>([]);

  const snapshot = React.useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const json = JSON.stringify(c.toJSON());
    historyRef.current = [...historyRef.current.slice(-(MAX_HIST - 1)), json];
    futureRef.current = [];
  }, []);

  React.useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;

    const canvas = new FabricCanvas(el, {
      width,
      height,
      backgroundColor: "#0f172a",
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    const onSel = () => onSelectionChange?.(canvas.getActiveObject() ?? null);
    canvas.on("selection:created", onSel);
    canvas.on("selection:updated", onSel);
    canvas.on("selection:cleared", () => onSelectionChange?.(null));
    canvas.on("object:modified", snapshot);

    const api: EditorCanvasHandle = {
      getCanvas: () => fabricRef.current,
      addText: () => {
        const t = new IText("Double-click to edit", {
          left: 120,
          top: 160,
          fontSize: 36,
          fill: "#f1f5f9",
          fontFamily: "Inter, system-ui, sans-serif",
        });
        canvas.add(t);
        canvas.setActiveObject(t);
        canvas.requestRenderAll();
        snapshot();
      },
      addRect: () => {
        const r = new Rect({
          left: 200,
          top: 200,
          width: 280,
          height: 180,
          fill: "#334155",
          stroke: "#64748b",
          strokeWidth: 2,
        });
        canvas.add(r);
        canvas.setActiveObject(r);
        canvas.requestRenderAll();
        snapshot();
      },
      addCircle: () => {
        const ci = new Circle({
          left: 260,
          top: 260,
          radius: 90,
          fill: "#0ea5e9",
          stroke: "#0369a1",
          strokeWidth: 2,
        });
        canvas.add(ci);
        canvas.setActiveObject(ci);
        canvas.requestRenderAll();
        snapshot();
      },
      addLine: () => {
        const ln = new Line([80, 400, width - 80, 400], {
          stroke: "#e2e8f0",
          strokeWidth: 4,
        });
        canvas.add(ln);
        canvas.setActiveObject(ln);
        canvas.requestRenderAll();
        snapshot();
      },
      deleteSelected: () => {
        const o = canvas.getActiveObject();
        if (!o) return;
        if (o instanceof ActiveSelection) {
          o.getObjects().forEach((x) => canvas.remove(x));
        }
        canvas.remove(o);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        snapshot();
      },
      duplicateSelected: () => {
        const o = canvas.getActiveObject();
        if (!o) return;
        void o.clone().then((cloned: FabricObject) => {
          cloned.set({ left: (o.left ?? 0) + 24, top: (o.top ?? 0) + 24 });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.requestRenderAll();
          snapshot();
        });
      },
      bringForward: () => {
        const o = canvas.getActiveObject();
        if (!o) return;
        canvas.bringObjectForward(o);
        canvas.requestRenderAll();
        snapshot();
      },
      sendBackwards: () => {
        const o = canvas.getActiveObject();
        if (!o) return;
        canvas.sendObjectBackwards(o);
        canvas.requestRenderAll();
        snapshot();
      },
      undo: () => {
        const h = historyRef.current;
        if (h.length < 2) return;
        const cur = h.pop();
        if (cur) futureRef.current.unshift(cur);
        const prev = h[h.length - 1];
        if (prev) {
          void canvas.loadFromJSON(JSON.parse(prev) as object).then(() => canvas.renderAll());
        }
      },
      redo: () => {
        const f = futureRef.current.shift();
        if (!f) return;
        historyRef.current.push(f);
        void canvas.loadFromJSON(JSON.parse(f) as object).then(() => canvas.renderAll());
      },
      loadFromObject: async (data: object) => {
        await canvas.loadFromJSON(data);
        canvas.renderAll();
        historyRef.current = [JSON.stringify(canvas.toJSON())];
        futureRef.current = [];
      },
      getProjectData: () => canvas.toJSON(),
      applyImageFromFile: (file: File) => {
        const r = new FileReader();
        r.onload = () => {
          const url = r.result as string;
          void FabricImage.fromURL(url, { crossOrigin: "anonymous" }).then((img) => {
            img.scaleToWidth(Math.min(520, width * 0.5));
            img.set({ left: 100, top: 240 });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();
            snapshot();
          });
        };
        r.readAsDataURL(file);
      },
      setImageBrightnessContrast: (brightness, contrast) => {
        const o = canvas.getActiveObject();
        if (!o || o.type !== "image") return;
        const img = o as FabricImage;
        img.filters = [
          new filters.Brightness({ brightness }),
          new filters.Contrast({ contrast }),
        ];
        void img.applyFilters();
        canvas.requestRenderAll();
        snapshot();
      },
      setTextStyle: (partial) => {
        const o = canvas.getActiveObject();
        if (!o) return;
        if (o.type !== "i-text" && o.type !== "text" && o.type !== "textbox") return;
        const { shadow, ...rest } = partial;
        const textObj = o as FabricText;
        if (shadow === null) {
          textObj.set({ ...rest, shadow: null });
        } else if (shadow) {
          textObj.set({ ...rest, shadow: new Shadow(shadow) });
        } else {
          textObj.set(rest);
        }
        canvas.requestRenderAll();
        snapshot();
      },
      exportDataUrl: (format) => {
        try {
          return exportMarketingCanvasToDataUrl(canvas, format);
        } catch {
          return null;
        }
      },
      applyTemplate: (templateId) => {
        applyMarketingTemplate(canvas, templateId);
        historyRef.current = [JSON.stringify(canvas.toJSON())];
        futureRef.current = [];
      },
      placeAiMarketingBlocks: (blocks) => {
        const tagLine = blocks.hashtags.slice(0, 8).join(" ");
        const h = new IText(blocks.headline, {
          left: 72,
          top: 72,
          fontSize: 40,
          fill: "#f8fafc",
          fontWeight: "700",
          fontFamily: "Inter, system-ui, sans-serif",
          width: width - 144,
        });
        const s = new IText(blocks.subhead, {
          left: 72,
          top: 140,
          fontSize: 22,
          fill: "#94a3b8",
          fontFamily: "Inter, system-ui, sans-serif",
          width: width - 144,
        });
        const b = new IText(blocks.body.length > 400 ? `${blocks.body.slice(0, 397)}…` : blocks.body, {
          left: 72,
          top: 220,
          fontSize: 18,
          fill: "#cbd5e1",
          fontFamily: "Inter, system-ui, sans-serif",
          width: width - 144,
        });
        const c = new IText(blocks.cta, {
          left: 72,
          top: height - 200,
          fontSize: 26,
          fill: "#34d399",
          fontWeight: "600",
          fontFamily: "Inter, system-ui, sans-serif",
        });
        const ht = new IText(tagLine, {
          left: 72,
          top: height - 120,
          fontSize: 16,
          fill: "#64748b",
          fontFamily: "Inter, system-ui, sans-serif",
          width: width - 144,
        });
        canvas.add(h, s, b, c, ht);
        canvas.setActiveObject(h);
        canvas.requestRenderAll();
        snapshot();
      },
      setSelectedOpacity: (opacity) => {
        const o = canvas.getActiveObject();
        if (!o) return;
        o.set({ opacity: Math.max(0, Math.min(1, opacity)) });
        canvas.requestRenderAll();
        snapshot();
      },
      setSelectedFill: (fill) => {
        const o = canvas.getActiveObject();
        if (!o) return;
        const t = o.type;
        if (t === "rect" || t === "circle" || t === "line") {
          o.set(t === "line" ? { stroke: fill } : { fill });
          canvas.requestRenderAll();
          snapshot();
        }
      },
      setSelectedStroke: (stroke) => {
        const o = canvas.getActiveObject();
        if (!o) return;
        const t = o.type;
        if (t === "rect" || t === "circle" || t === "line") {
          o.set({ stroke });
          canvas.requestRenderAll();
          snapshot();
        }
      },
    };

    historyRef.current = [JSON.stringify(canvas.toJSON())];
    onReady?.(api);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [height, onReady, onSelectionChange, snapshot, width]);

  return (
    <div className="relative overflow-auto rounded-xl border border-zinc-700 bg-zinc-950 shadow-inner">
      <canvas ref={canvasElRef} className="block max-h-[min(70vh,920px)]" />
    </div>
  );
}
