/**
 * Network effect *indicators* from operational counts — illustrative, not market definition.
 * Growth should remain user-valued and sustainable; metrics do not justify anti-competitive conduct.
 */

export type NetworkActivitySnapshot = {
  /** Active or engaged broker accounts in the window (definition is yours). */
  brokers: number;
  /** Net-new or qualified leads in the window. */
  leads: number;
  /** Open or closed deals counted in the window. */
  deals: number;
  /** Messages, calls logged, showing requests, etc. — unified counter you define. */
  interactions: number;
  /** Optional prior window for growth comparisons. */
  prior?: Partial<Pick<NetworkActivitySnapshot, "brokers" | "leads" | "deals" | "interactions">>;
};

export type NetworkEffectMetrics = {
  /** 0–100 heuristic composite for dashboard sparklines — not a scientific network-effect measure. */
  networkActivityIndex: number;
  /** Per-dimension 0–100 normalized contributions. */
  components: {
    id: keyof Pick<NetworkActivitySnapshot, "brokers" | "leads" | "deals" | "interactions">;
    label: string;
    value: number;
    normalized: number;
    delta: number | null;
  }[];
  narrative: string[];
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function norm(n: number, scale: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  // Saturating curve: diminishing returns so huge counts don't imply "infinite" effects
  const x = n / scale;
  return clamp(Math.round(100 * (1 - Math.exp(-x))), 0, 100);
}

function deltaRatio(current: number, prior: number | undefined): number | null {
  if (prior == null || !Number.isFinite(prior) || prior <= 0) return null;
  return (current - prior) / prior;
}

/**
 * Combine counts into a simple index and growth hints.
 */
export function assessNetworkEffects(snapshot: NetworkActivitySnapshot): NetworkEffectMetrics {
  const scales = {
    brokers: 200,
    leads: 2000,
    deals: 500,
    interactions: 20_000,
  } as const;

  const keys = ["brokers", "leads", "deals", "interactions"] as const;
  const labels: Record<(typeof keys)[number], string> = {
    brokers: "Brokers / partner participants",
    leads: "Leads",
    deals: "Deals",
    interactions: "Interactions",
  };

  const components = keys.map((id) => {
    const value = Math.max(0, Number(snapshot[id]) || 0);
    const priorRaw = snapshot.prior?.[id];
    const prior = priorRaw != null ? Math.max(0, Number(priorRaw) || 0) : undefined;
    return {
      id,
      label: labels[id],
      value,
      normalized: norm(value, scales[id]),
      delta: deltaRatio(value, prior),
    };
  });

  const networkActivityIndex = Math.round(
    components.reduce((s, c) => s + c.normalized, 0) / components.length
  );

  const narrative: string[] = [
    "Index is a planning shorthand: rising activity only matters if it correlates with user-perceived value and healthy unit economics.",
  ];

  for (const c of components) {
    if (c.delta == null) {
      narrative.push(`${c.label}: ${c.value.toLocaleString()} (no prior window for growth).`);
    } else {
      narrative.push(
        `${c.label}: ${c.value.toLocaleString()} (${(c.delta * 100).toFixed(1)}% vs prior window).`
      );
    }
  }

  return { networkActivityIndex, components, narrative };
}
