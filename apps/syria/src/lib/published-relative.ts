/**
 * Facebook-style "posted … ago" for listing trust line (server or client, pure).
 */
export function formatPublishedRelative(iso: Date | string, locale: string): string {
  const t = typeof iso === "string" ? new Date(iso) : iso;
  const tMs = t.getTime();
  if (!Number.isFinite(tMs)) return "";
  const diffSec = Math.floor((Date.now() - tMs) / 1000);
  if (diffSec < 0) {
    return new Intl.RelativeTimeFormat(locale.toLowerCase().startsWith("ar") ? "ar" : "en", { numeric: "auto" }).format(0, "second");
  }
  const loc = locale.toLowerCase().startsWith("ar") ? "ar" : "en";
  const rtf = new Intl.RelativeTimeFormat(loc, { style: "long", numeric: "auto" });
  if (diffSec < 50) {
    return rtf.format(0, "second");
  }
  if (diffSec < 3600) {
    const m = Math.max(1, Math.floor(diffSec / 60));
    return rtf.format(-m, "minute");
  }
  if (diffSec < 86400) {
    const h = Math.max(1, Math.floor(diffSec / 3600));
    return rtf.format(-h, "hour");
  }
  const d = Math.max(1, Math.floor(diffSec / 86400));
  if (d < 7) {
    return rtf.format(-d, "day");
  }
  const w = Math.floor(d / 7);
  if (d < 30) {
    return rtf.format(-w, "week");
  }
  const mo = Math.max(1, Math.floor(d / 30));
  if (d < 365) {
    return rtf.format(-mo, "month");
  }
  const y = Math.max(1, Math.floor(d / 365));
  return rtf.format(-y, "year");
}
