import "server-only";

/** Stub heatmap analyzer — returns stable labels for build / demo routes. */
export function analyzeDemandZone(p: {
  id?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  featured?: boolean | null;
  status?: string;
}) {
  void p;
  return {
    demandScore: 50,
    demandLabel: "medium" as const,
    weight: 1,
  };
}
