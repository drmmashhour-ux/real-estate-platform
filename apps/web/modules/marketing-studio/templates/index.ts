/**
 * LECIPM Marketing Studio v1 — preset canvas layouts (Fabric JSON-compatible object lists).
 * Applied client-side after Fabric Canvas is created.
 */
import type { Canvas } from "fabric";
import { Circle, FabricText, Line, Rect } from "fabric";

const W = 1080;
const H = 1080;

export type MarketingTemplateId = "bnhub_listing" | "luxury" | "rental" | "investor";

export const MARKETING_TEMPLATE_LABELS: Record<MarketingTemplateId, string> = {
  bnhub_listing: "BNHub listing ad",
  luxury: "Luxury real estate",
  rental: "Rental ad",
  investor: "Investor ad",
};

function baseBackground(canvas: Canvas) {
  canvas.backgroundColor = "#0f172a";
  const frame = new Rect({
    left: 0,
    top: 0,
    width: W,
    height: H,
    fill: "#0f172a",
    selectable: false,
    evented: false,
    excludeFromExport: false,
  });
  frame.set("data", { role: "background" });
  canvas.add(frame);
}

export function applyMarketingTemplate(canvas: Canvas, id: MarketingTemplateId) {
  canvas.clear();
  canvas.backgroundColor = "#0f172a";
  baseBackground(canvas);

  const headline = new FabricText("Headline", {
    left: 80,
    top: 100,
    fontSize: 56,
    fill: "#f8fafc",
    fontWeight: "700",
    fontFamily: "Inter, system-ui, sans-serif",
    width: W - 160,
  });
  const sub = new FabricText("Supporting line for your property or offer.", {
    left: 80,
    top: 200,
    fontSize: 28,
    fill: "#94a3b8",
    fontFamily: "Inter, system-ui, sans-serif",
    width: W - 160,
  });
  const cta = new FabricText("Book / List / Explore", {
    left: 80,
    top: H - 200,
    fontSize: 32,
    fill: "#34d399",
    fontWeight: "600",
    fontFamily: "Inter, system-ui, sans-serif",
  });

  if (id === "bnhub_listing") {
    canvas.add(headline, sub, cta);
    const badge = new Rect({
      left: 80,
      top: 360,
      width: 400,
      height: 280,
      fill: "#1e293b",
      stroke: "#334155",
      strokeWidth: 2,
      rx: 12,
      ry: 12,
    });
    const ph = new FabricText("Listing photo", {
      left: 200,
      top: 470,
      fontSize: 22,
      fill: "#64748b",
    });
    canvas.add(badge, ph);
  } else if (id === "luxury") {
    headline.set({ fill: "#fef3c7", fontSize: 52 });
    sub.set({ fill: "#cbd5e1" });
    const gold = new Line([80, 320, W - 80, 320], { stroke: "#d4af37", strokeWidth: 2 });
    canvas.add(headline, sub, gold, cta);
  } else if (id === "rental") {
    headline.set({ fontSize: 48 });
    const chip = new Circle({
      left: W - 200,
      top: 90,
      radius: 48,
      fill: "#22c55e",
      opacity: 0.9,
    });
    const rent = new FabricText("Rent", {
      left: W - 188,
      top: 118,
      fontSize: 20,
      fill: "#022c22",
      fontWeight: "700",
    });
    canvas.add(headline, sub, chip, rent, cta);
  } else {
    headline.set({ text: "Invest with clarity" });
    const grid = new Rect({
      left: 80,
      top: 380,
      width: W - 160,
      height: 4,
      fill: "#334155",
      opacity: 0.6,
    });
    canvas.add(headline, sub, grid, cta);
  }

  canvas.requestRenderAll();
}
