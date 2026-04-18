import type { FunnelReport, FunnelStep } from "./funnel.types";

function safeRate(a: number, b: number): number {
  if (b <= 0) return 0;
  return Math.round((1000 * (b - a)) / b) / 10;
}

export function detectDropoffs(steps: FunnelStep[]): { from: string; to: string; rate: number }[] {
  const drops: { from: string; to: string; rate: number }[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const from = steps[i]!;
    const to = steps[i + 1]!;
    if (from.count > 0) {
      const rate = safeRate(to.count, from.count);
      if (rate > 5) drops.push({ from: from.key, to: to.key, rate });
    }
  }
  return drops.sort((a, b) => b.rate - a.rate);
}

export function fixesForGuestBnhub(drops: { from: string; to: string; rate: number }[]): string[] {
  const fixes: string[] = [];
  for (const d of drops) {
    if (d.from === "view_listing" && d.to === "booking_start") {
      fixes.push("Reduce booking friction: clarify total price, Stripe checkout steps, and instant-book eligibility.");
    }
    if (d.from === "booking_start" && d.to === "booking_complete") {
      fixes.push("Investigate abandoned checkouts: payment errors, identity verification, and calendar conflicts.");
    }
  }
  if (fixes.length === 0) {
    fixes.push("Collect more granular step events (save, checkout open) to localize drop-offs.");
  }
  return fixes;
}
