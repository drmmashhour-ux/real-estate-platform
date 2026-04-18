import type { InvestorStoryBundle } from "@/modules/investor-story/investor-story.service";
import type { PositioningBundle } from "@/modules/positioning/positioning.service";

export type PitchDeckOutline = {
  title: string;
  slides: { title: string; bullets: string[] }[];
};

/** Outline only — export to Slides manually; no fabricated traction adjectives. */
export function generatePitchDeckOutline(story: InvestorStoryBundle, positioning: PositioningBundle): PitchDeckOutline {
  const userRow = story.metrics.rows.find((r) => r.metric === "total_users");
  const gmv = story.metrics.rows.find((r) => r.metric === "gmv_booking_total_cents_30d");

  return {
    title: "LECIPM — Québec brokerage + BNHub",
    slides: [
      {
        title: "Problem",
        bullets: [
          "STR guests and resale clients expect integrated trust + compliance.",
          "Brokers juggle disconnected CRM, stays, and document workflows.",
        ],
      },
      {
        title: "Solution",
        bullets: [
          "LECIPM: BNHub stays + residential deal OS with review-first AI assistance.",
          "Single identity across hospitality and brokerage surfaces (where product enabled).",
        ],
      },
      {
        title: "Traction (internal)",
        bullets: [
          typeof userRow?.value === "number" ? `Registered users: ${userRow.value}.` : "User count — see metrics export.",
          typeof gmv?.value === "number" ? `30d BNHub GMV (cents): ${gmv.value}.` : "GMV — see metrics export.",
          ...story.tractionSummary.bullets.slice(0, 2),
        ],
      },
      {
        title: "Why us vs " + positioning.focus,
        bullets: positioning.differentiation.slice(0, 3).map((d) => `${d.axis}: ${d.lecipmCapability}`),
      },
      {
        title: "Go-to-market",
        bullets: [
          "Montreal-first density (see growth engine modules).",
          "Compliant acquisition — opt-in, Law 25, no spam automation.",
        ],
      },
      {
        title: "Ask",
        bullets: [
          "Use attached CSV/JSON exports for diligence — metrics are DB-sourced.",
          "Timeline and round structure — founder to complete.",
        ],
      },
    ],
  };
}
