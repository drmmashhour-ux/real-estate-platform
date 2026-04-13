import { buildGenerationUserMessage } from "./build-generation-user-message";
import { marketingCompleteJson } from "./completion";
import type { GrowthIdeasInput, GrowthIdeasResult } from "./types";

type IdeasJson = { ideas?: string[] };

const BASE_IDEAS_EARLY: string[] = [
  "Feature 3 guest booking success stories (video + quote) on BNHUB social — tag hosts when they opt in.",
  "Weekly 'top stays' carousel sourced from real availability — avoid fake scarcity; rotate cities.",
  "Partner with 5 local businesses (cafés, luggage, parking) for co-branded 'weekend in [city]' landing pages.",
  "Run a host referral: existing hosts invite another property — track in a simple spreadsheet before automating.",
  "Publish a transparent 'how reviews work on BNHUB' page and push it in email onboarding.",
  "Cold-DM 20 boutique brokers with a one-page BNHUB × listing syndication blurb (no mass blast).",
  "Add a lightweight 'share your trip' prompt post-checkout — UGC without incentivizing fake reviews.",
];

const BASE_IDEAS_PRE: string[] = [
  "Ship a waitlist landing with one proof point (e.g. # of hosts in pipeline) only if accurate.",
  "Record a 60s founder walkthrough of the host dashboard — use as ad creative and sales asset.",
  "Sponsor one local real-estate meetup booth — collect emails for early host beta only.",
  "Publish 5 SEO posts: '[city] short-term rental rules' linking to BNHUB as the compliant booking path.",
  "Build a 'partner with BNHUB' one-pager for insurers and property managers — PDF + Cal link.",
];

function fallbackIdeas(input: GrowthIdeasInput): string[] {
  const pool = input.stage === "pre_launch" ? [...BASE_IDEAS_PRE, ...BASE_IDEAS_EARLY] : [...BASE_IDEAS_EARLY, ...BASE_IDEAS_PRE];
  const topic = input.topic.trim().toLowerCase();
  const filtered = pool.filter((_, i) => (topic.length + i) % 2 === 0 || topic.length < 3);
  const ideas = (filtered.length >= 6 ? filtered : pool).slice(0, 8);
  if (input.context?.trim()) {
    ideas[ideas.length - 1] = `${ideas[ideas.length - 1]} (Tailor to: ${input.context.trim().slice(0, 80)})`;
  }
  return ideas;
}

/**
 * Actionable growth ideas for BNHUB / LECIPM — practical, startup-biased.
 */
export async function generateGrowthIdeas(input: GrowthIdeasInput): Promise<GrowthIdeasResult> {
  const stage = input.stage ?? "early";
  const system = `You suggest concrete growth tactics for BNHUB (short-term stays marketplace) and LECIPM (real estate platform).
Rules:
- Return JSON only: {"ideas": string[]} with 6–10 items.
- Each item: one specific action (not generic 'post more on social').
- Prefer: partnerships, UGC, host supply, trust/reviews, local SEO, referrals, community, light experiments.
- Stage hint: ${stage}.
- No fake metrics. Ideas must be executable by a small team.`;

  const user = buildGenerationUserMessage(
    {
      topic: input.topic,
      audience: input.audience,
      tone: input.tone ?? "",
      context: input.context ?? "",
      stage,
      ...(input.variantLabel
        ? {
            variantLabel: input.variantLabel,
            variantOfTotal: input.variantOfTotal ?? 1,
            variantInstruction: "A/B set: different growth angles than other variants in this batch.",
          }
        : {}),
    },
    input.feedback
  );

  const ai = await marketingCompleteJson<IdeasJson>({
    system,
    user,
    maxTokens: 900,
    temperature: 0.55 + (input.variantLabel ? (input.variantLabel.charCodeAt(0) - 65) * 0.03 : 0),
  });

  if (ai?.data?.ideas && Array.isArray(ai.data.ideas)) {
    const cleaned = ai.data.ideas
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim())
      .slice(0, 12);
    if (cleaned.length >= 4) {
      return { ideas: cleaned, source: ai.source };
    }
  }

  return { ideas: fallbackIdeas(input), source: "fallback" };
}

export async function generateGrowthIdeasVariants(
  input: GrowthIdeasInput,
  count: number
): Promise<GrowthIdeasResult[]> {
  const n = Math.min(Math.max(Math.floor(count), 1), 3);
  const out: GrowthIdeasResult[] = [];
  for (let i = 0; i < n; i++) {
    const label = String.fromCharCode(65 + i);
    out.push(
      await generateGrowthIdeas({
        ...input,
        variantLabel: label,
        variantOfTotal: n,
      })
    );
  }
  return out;
}
