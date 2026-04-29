/**
 * Client-safe helpers for exporting / printing the demo pitch deck.
 * Prefer browser print-to-PDF (no remote services; no user data leaves the page).
 */

export function printPitchDeck(): void {
  if (typeof window !== "undefined") window.print();
}

/** Rasterize one slide for quick sharing — runs client-side only; no server upload. */
export async function downloadPitchDeckSlidePng(el: HTMLElement | null, filename = "lecipm-slide.png"): Promise<void> {
  if (!el || typeof window === "undefined") return;
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(el, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#050505",
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}