import type { MarketingAiContentIdea } from "./ai-content.types";
import { newAiId } from "./ai-content-ids";

const CITY = (c: string) => c.trim() || "Montréal";

function seedInt(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

type TemplateRow = { title: (city: string) => string; angle: string; formatHint: MarketingAiContentIdea["formatHint"] };

const LIBRARY: TemplateRow[] = [
  {
    title: (city) => `How brokers get more clients in ${city} — without buying junk leads`,
    angle: "Trust routing vs volume games",
    formatHint: "talking_head",
  },
  {
    title: (city) => `Top 3 areas to research in ${city} before you make an offer`,
    angle: "Neighbourhood momentum + walkability",
    formatHint: "short_video",
  },
  {
    title: (city) => `Luxury condo tour: ${city} skyline in 60 seconds`,
    angle: "Premium inventory discovery",
    formatHint: "short_video",
  },
  {
    title: (city) => `FSBO vs broker-led: what ${city} buyers actually compare first`,
    angle: "Clarity beats noise",
    formatHint: "carousel",
  },
  {
    title: (city) => `BNHUB stays: how hosts price weekends in ${city}`,
    angle: "Revenue hygiene, not get-rich promises",
    formatHint: "talking_head",
  },
  {
    title: (city) => `Investor checklist: rent comps in ${city} you can verify yourself`,
    angle: "Research discipline (not investment advice)",
    formatHint: "carousel",
  },
  {
    title: (city) => `The ${city} market in one honest chart (what moves first)`,
    angle: "Macro reality check",
    formatHint: "short_video",
  },
  {
    title: (city) => `First-time buyer in ${city}? Start with this 3-step filter`,
    angle: "Reduce overwhelm",
    formatHint: "talking_head",
  },
];

/**
 * Generate on-brand content ideas (titles + angles). Deterministic mix for a given city + count.
 */
export function generateContentIdeas(
  city: string,
  count: number,
  salt = "v1"
): MarketingAiContentIdea[] {
  const c = CITY(city);
  const n = Math.max(1, Math.min(count, LIBRARY.length));
  const s = seedInt(`${salt}:${c}`);
  const out: MarketingAiContentIdea[] = [];
  for (let i = 0; i < n; i++) {
    const row = LIBRARY[(s + i * 7) % LIBRARY.length]!;
    out.push({
      id: newAiId("idea"),
      title: row.title(c),
      angle: row.angle,
      formatHint: row.formatHint,
      city: c,
    });
  }
  return out;
}
