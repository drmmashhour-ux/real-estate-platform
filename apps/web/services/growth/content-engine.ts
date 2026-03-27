/**
 * Daily content ideation — hooks, captions, short video outlines. Deterministic rotation by day index.
 * See docs/content-30days.md for the full calendar.
 */

export type ContentPillar = "find_stay" | "host_earn" | "platform_trust" | "local" | "social_proof";

export type ContentIdea = {
  pillar: ContentPillar;
  topic: string;
  hook: string;
  caption: string;
  videoScript: string[];
};

const ROTATION: ContentIdea[] = [
  {
    pillar: "find_stay",
    topic: "3 filters that cut fake listings",
    hook: "Stop wasting time on listings that don’t exist.",
    caption: "Verified stays + clear pricing. Save this for your next trip.",
    videoScript: [
      "Hook: 3-second problem (bad listings).",
      "Show: open BNHub search, toggle verified / price filter.",
      "CTA: Link in bio — early access.",
    ],
  },
  {
    pillar: "host_earn",
    topic: "What early hosts get that OTAs won’t give",
    hook: "Hosts: you’re not just a row in a spreadsheet.",
    caption: "Lower fees, real marketing, humans who answer. DM “host”.",
    videoScript: [
      "Hook: host frustration (fees / ghost support).",
      "2 bullets: visibility + onboarding help.",
      "CTA: Comment HOST.",
    ],
  },
  {
    pillar: "platform_trust",
    topic: "Why we verify before we promote",
    hook: "Trust isn’t a badge — it’s a process.",
    caption: "We’d rather have fewer listings than risky ones.",
    videoScript: [
      "15s: what verified means (ID / listing checks).",
      "CTA: Guests — try early access.",
    ],
  },
  {
    pillar: "local",
    topic: "Neighborhood spotlight (swap city weekly)",
    hook: "Best stays in [CITY] this month — our picks.",
    caption: "Tag someone planning a trip to [CITY].",
    videoScript: [
      "B-roll: neighborhood.",
      "Voice: 2 listing types (studio / family).",
      "CTA: Search [CITY] on BNHub.",
    ],
  },
  {
    pillar: "social_proof",
    topic: "Real guest / host quote (rotate)",
    hook: "They said they wouldn’t book anywhere else after this.",
    caption: "Early users get priority support. Join the wave.",
    videoScript: [
      "Quote on screen (permissioned).",
      "1 line: what problem we solved.",
      "CTA: Link in bio.",
    ],
  },
];

export function dayIndexUtc(date = new Date()): number {
  return Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
}

/** 2–3 ideas per day: primary + alternates from rotation. */
export function generateDailyContentIdeas(date = new Date(), count = 3): ContentIdea[] {
  const base = dayIndexUtc(date);
  const out: ContentIdea[] = [];
  for (let i = 0; i < count; i++) {
    out.push(ROTATION[(base + i) % ROTATION.length]);
  }
  return out;
}

export function captionForTopic(topic: string, cta = "Link in bio."): string {
  return `${topic} — ${cta}`;
}

export function videoScriptForPillar(pillar: ContentPillar): string[] {
  const hit = ROTATION.find((r) => r.pillar === pillar);
  return hit ? [...hit.videoScript] : [...ROTATION[0].videoScript];
}
