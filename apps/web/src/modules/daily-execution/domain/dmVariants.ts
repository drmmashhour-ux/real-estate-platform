export type DmScriptRow = { variant: string; body: string; performanceScore?: number | null };

export type DmVariantDisplay = {
  label: "A" | "B" | "C";
  variantKey: string;
  text: string;
  performanceScore: number | null;
  uses: number;
  replies: number;
};

const ORDER = ["curiosity", "problem_focused", "direct_value"] as const;
const LABELS: ("A" | "B" | "C")[] = ["A", "B", "C"];

function fallbackBody(key: (typeof ORDER)[number]): string {
  switch (key) {
    case "curiosity":
      return `Hey — quick curiosity question.

I'm building an AI workspace for brokers that maps the next best action in live deals.

Open to a 15-min peek this week?`;
    case "problem_focused":
      return `Hey — most brokers I talk to are losing time on unclear next steps once a deal gets moving.

We built LECIPM to cut costly mistakes and keep decisions structured.

Worth a 15-min look?`;
    case "direct_value":
      return `Hey — quick ask.

LECIPM is an AI-assisted broker workspace: deal guidance, checklists, and step-by-step decision support.

If you want a 15–20 min demo, I'll keep it tight.`;
    default:
      return "";
  }
}

/**
 * Builds A/B/C display rows from DB scripts (seeded or admin-edited). Always returns three slots.
 */
export function generateDMVariants(rows: DmScriptRow[], stats: Record<string, { uses: number; replies: number }>): DmVariantDisplay[] {
  const map = new Map(rows.map((r) => [r.variant.trim(), r]));
  return ORDER.map((key, i) => {
    const row = map.get(key);
    const s = stats[key] ?? { uses: 0, replies: 0 };
    return {
      label: LABELS[i],
      variantKey: key,
      text: row?.body?.trim() ? row.body.trim() : fallbackBody(key),
      performanceScore: row?.performanceScore ?? null,
      uses: s.uses,
      replies: s.replies,
    };
  });
}
