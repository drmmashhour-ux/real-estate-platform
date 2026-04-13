/**
 * Smooth-scroll to the in-page map search region (sticky header offset via scroll-margin on the target).
 */
export function scrollToMapSearchRegion(
  elementId: string,
  opts?: { delayMs?: number; behavior?: ScrollBehavior }
): void {
  if (typeof document === "undefined") return;
  const { delayMs = 160, behavior = "smooth" } = opts ?? {};
  window.setTimeout(() => {
    document.getElementById(elementId)?.scrollIntoView({ behavior, block: "start" });
  }, delayMs);
}
