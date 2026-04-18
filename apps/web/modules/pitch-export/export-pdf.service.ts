import type { InvestorSlide } from "@/modules/investor-pitch/slide-generator.service";

/** Printable HTML — user prints to PDF from browser (no headless Chrome in v1). */
export function exportPitchDeckAsPrintableHtml(title: string, slides: InvestorSlide[]): { filename: string; body: string } {
  const items = slides
    .map(
      (s) =>
        `<section class="slide"><h2>${escapeHtml(s.id)}. ${escapeHtml(s.title)}</h2><ul>${s.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul></section>`
    )
    .join("\n");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#111} .slide{page-break-after:always;margin-bottom:48px}</style></head><body><h1>${escapeHtml(title)}</h1>${items}</body></html>`;
  return {
    filename: `lecipm-pitch-deck-${new Date().toISOString().slice(0, 10)}.html`,
    body: html,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
