export type VariantStats = Record<string, { uses: number; replies: number }>;

export function parseVariantStats(json: unknown): VariantStats {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  const out: VariantStats = {};
  for (const [k, v] of Object.entries(json as Record<string, unknown>)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const uses = typeof (v as { uses?: unknown }).uses === "number" ? Math.max(0, (v as { uses: number }).uses) : 0;
      const replies =
        typeof (v as { replies?: unknown }).replies === "number" ? Math.max(0, (v as { replies: number }).replies) : 0;
      out[k] = { uses, replies };
    }
  }
  return out;
}
