import type { InvestorStoryBundle } from "@/modules/investor-story/investor-story.service";
import type { PositioningBundle } from "@/modules/positioning/positioning.service";

export type InvestorSlide = { id: string; title: string; bullets: string[] };

/**
 * 10-slide outline — traction slide uses **only** passed metric rows (DB-sourced).
 */
export function generateInvestorSlideDeck(story: InvestorStoryBundle, positioning: PositioningBundle): {
  title: string;
  slides: InvestorSlide[];
} {
  const userRow = story.metrics.rows.find((r) => r.metric === "total_users");
  const gmv = story.metrics.rows.find((r) => r.metric === "gmv_booking_total_cents_30d");
  const hosts = story.metrics.rows.find((r) => r.metric === "active_hosts");

  const tractionBullets = [
    typeof userRow?.value === "number" ? `Registered users (all time): ${userRow.value}` : "User count — see metrics export.",
    typeof gmv?.value === "number" ? `30d BNHub booking GMV (cents): ${gmv.value}` : "GMV — see metrics export.",
    typeof hosts?.value === "number" ? `Active hosts (point in time): ${hosts.value}` : "Hosts — see metrics export.",
    ...story.tractionSummary.bullets.slice(0, 2),
  ];

  const slides: InvestorSlide[] = [
    { id: "1", title: "Problem", bullets: ["Guests and sellers expect integrated trust, compliance, and transparent fees.", "Operators run fragmented STR + resale stacks."] },
    { id: "2", title: "Solution (LECIPM)", bullets: ["BNHub short-term + residential brokerage OS in one platform (feature-flagged).", "Stripe for card rails; human review for legal/AI outputs."] },
    { id: "3", title: "Product", bullets: ["BNHub: listings, booking, Connect payouts where enabled.", "Brokerage: CRM, deals, documents — Québec-facing workflows."] },
    { id: "4", title: "Market", bullets: ["Montreal-first density; expansion requires market configuration + compliance review.", "No inflated TAM figures here — diligence uses your market model."] },
    { id: "5", title: "Traction (real data)", bullets: tractionBullets },
    { id: "6", title: "Business model", bullets: ["Take rate via BNHub fees + brokerage success/lead economics (configuration-driven).", "See monetization / pricing exports for fee anchors."] },
    { id: "7", title: "Competitive advantage", bullets: positioning.differentiation.slice(0, 4).map((d) => `${d.axis}: ${d.lecipmCapability}`) },
    {
      id: "8",
      title: "Growth strategy",
      bullets: [
        story.growthNarrative.paragraphs[0] ?? story.growthNarrative.title,
        "Compliant acquisition — opt-in outreach, Law 25 patterns for marketing.",
      ],
    },
    { id: "9", title: "Vision", bullets: ["Single trusted operating system for hospitality + resale in Québec and beyond.", "Investor metrics remain DB-backed — no vanity charts in-product."] },
    { id: "10", title: "Ask", bullets: ["Use CSV/JSON exports for diligence.", "Round size & terms — founder completes."] },
  ];

  return { title: "LECIPM — Investor deck (outline)", slides };
}
