/**
 * PPTX export for the web app uses **pptxgenjs** (runs in Node / Next.js routes).
 * For **python-pptx**, use `scripts/pitch_deck_pptx.py` (optional local / CI).
 */

import PptxGenJS from "pptxgenjs";
import type { PitchDeckSlide } from "@prisma/client";

export const DEFAULT_PPTX_FILENAME = "lecipm_pitch_deck.pptx";

/** Colab / Cursor-style path referenced in product spec (local Python script default). */
export const PYTHON_PPTX_DEFAULT_PATH = "/mnt/data/lecipm_pitch_deck.pptx";

export type SlideForExport = Pick<PitchDeckSlide, "title" | "type" | "order" | "content">;

function contentToParagraphs(content: unknown): string[] {
  if (content && typeof content === "object" && !Array.isArray(content)) {
    const c = content as Record<string, unknown>;
    if (Array.isArray(c.bullets)) {
      return (c.bullets as unknown[]).map((b) => (typeof b === "string" ? b : String(b)));
    }
    if (typeof c.subtitle === "string") {
      const lines = [c.subtitle];
      if (Array.isArray(c.bullets)) {
        lines.push(
          "",
          ...(c.bullets as unknown[]).map((b) => `• ${typeof b === "string" ? b : String(b)}`)
        );
      }
      return lines;
    }
  }
  return [JSON.stringify(content, null, 2)];
}

/**
 * Build a `.pptx` as ArrayBuffer (8 slides: title → vision, matching generator order).
 */
export async function buildPitchDeckPptxBuffer(slides: SlideForExport[]): Promise<ArrayBuffer> {
  const ordered = [...slides].sort((a, b) => a.order - b.order);
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "LECIPM";
  pptx.title = "LECIPM Investor Pitch";

  for (const s of ordered) {
    const slide = pptx.addSlide();
    slide.addText(s.title, {
      x: 0.5,
      y: 0.35,
      w: 12.5,
      h: 0.9,
      fontSize: 32,
      bold: true,
      color: "0f172a",
      fontFace: "Arial",
    });
    const body = contentToParagraphs(s.content).join("\n");
    slide.addText(body, {
      x: 0.5,
      y: 1.35,
      w: 12.5,
      h: 5.5,
      fontSize: 16,
      color: "334155",
      fontFace: "Arial",
      valign: "top",
    });
    slide.addText(`Slide type: ${s.type}`, {
      x: 0.5,
      y: 6.95,
      w: 12,
      fontSize: 10,
      color: "94a3b8",
    });
  }

  const out = await pptx.write({ outputType: "arraybuffer" });
  return out as ArrayBuffer;
}
