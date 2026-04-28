/** Placeholder catalogue for HadiaLink lite in apps/web — same pagination envelope as Syria APIs (no BNHub coupling). */

import type { HadialinkLiteRow } from "@/lib/hadia-lite/format-text-row";

export type HadiaLiteListingItem = HadialinkLiteRow & { location: string };

/** ~40 deterministic stub rows — never fetch full oversized payloads on the wire. */
const TITLES = [
  "Damascus downtown stay",
  "Latakia sea view nightly",
  "Aleppo old city loft",
  "Homs family flat",
  "Tartus harbor walk studio",
];

export function getDemoHadialiteListingSlice(page: number, limit: number): {
  items: HadiaLiteListingItem[];
  hasMore: boolean;
  nextPage: number | null;
} {
  const take = Math.min(Math.max(limit, 1), 50);
  const p = Math.max(1, Math.floor(page));
  const TOTAL = 40;
  const start = (p - 1) * take;
  const demo: HadiaLiteListingItem[] = [];
  const endCap = Math.min(start + take + 1, TOTAL);
  for (let i = start; i < endCap; i++) {
    demo.push({
      id: String(i + 1),
      title: `${TITLES[i % TITLES.length]} #${i + 1}`,
      price: `${(45_000 + (i % 8) * 5000).toLocaleString()} SYP`,
      location: ["Damascus", "Latakia", "Aleppo", "Tartus", "Homs"][i % 5] ?? "Syria",
      available: i % 11 !== 0,
    });
  }
  const hasMore = demo.length > take;
  const items = hasMore ? demo.slice(0, take) : demo;
  const nextPage = hasMore ? p + 1 : null;
  return { items, hasMore, nextPage };
}
