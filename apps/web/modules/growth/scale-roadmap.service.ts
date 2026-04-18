import type { ScaleRoadmap } from "./scale-roadmap.types";

/**
 * Deterministic $0 → $10K → $100K → $1M roadmap (advisory; no execution).
 * Aligns with Growth OS stages; numbers are targets — track in CRM / revenue dashboards.
 */
export function buildScaleRoadmap(): ScaleRoadmap {
  return {
    stages: {
      "0_to_10k": [
        {
          title: "Stage 1 — $0 → ~$10K/mo (prove demand)",
          metrics: [
            "Acquire 10 brokers (active on platform)",
            "Generate 200 leads (qualified, attributable window)",
            "Close 5–10 deals (broker-attributed)",
          ],
          actions: [
            "Onboard brokers via CRM pipeline; track time-to-first-response.",
            "Run ads + landing funnel; measure cost per lead vs. target.",
            "Manual follow-up and routing — no auto-send; use Lead System + Routing V2 playbooks.",
          ],
        },
      ],
      "10k_to_100k": [
        {
          title: "Stage 2 — ~$10K → ~$100K/mo (density + monetization)",
          metrics: [
            "Expand to 2–3 cities (separate demand pools)",
            "1,000 leads/month (aggregate across markets)",
            "Increase pricing tiers (broker subscriptions / lead tiers — governance-approved only)",
          ],
          actions: [
            "Repeat city playbooks; use Fusion + Knowledge Graph for cross-market insights.",
            "Scale acquisition with measurable CAC; Autopilot remains draft/approval-gated.",
            "Review pricing changes in governance — never auto-apply in production.",
          ],
        },
      ],
      "100k_to_1m": [
        {
          title: "Stage 3 — ~$100K → ~$1M/mo (platform scale)",
          metrics: [
            "Marketplace scaling (supply + demand liquidity)",
            "Subscriptions + transaction fees (revenue mix)",
            "BNHub expansion (stays inventory + bookings)",
          ],
          actions: [
            "Deepen marketplace loops; Dynamic Pricing advisory only unless policy allows.",
            "Layer subscriptions and take-rate; finance controls for any fee changes.",
            "Roll out BNHub in priority metros; network effects + brand.",
          ],
        },
      ],
    },
  };
}
