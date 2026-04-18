import { prisma } from "@/lib/db";
import type { NotaryMatchInput, RankedNotary } from "./notary.types";

function parseLanguages(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string").map((s) => s.toLowerCase());
}

/**
 * Heuristic ranking — broker always confirms selection; this only suggests candidates.
 */
export async function matchNotaries(input: NotaryMatchInput): Promise<RankedNotary[]> {
  const rows = await prisma.notary.findMany({ where: { isActive: true } });
  const region = input.region?.toLowerCase().trim();
  const lang = input.languagePreference?.toLowerCase().trim();
  const limit = Math.min(input.limit ?? 12, 50);

  const scored = rows.map((n) => {
    let score = 0;
    const reasons: string[] = [];
    if (region && n.region?.toLowerCase().includes(region)) {
      score += 40;
      reasons.push("region_match");
    }
    if (lang) {
      const langs = parseLanguages(n.languagesJson);
      if (langs.some((l) => l.includes(lang) || lang.includes(l))) {
        score += 25;
        reasons.push("language_match");
      }
    }
    if (n.jurisdiction?.toLowerCase().includes("quebec") || n.jurisdiction?.toLowerCase().includes("qc")) {
      score += 10;
      reasons.push("qc_jurisdiction");
    }
    if (input.propertyTypeHint && n.notaryOffice) {
      score += 5;
      reasons.push("office_profile");
    }
    return { ...n, matchScore: score, matchReasons: reasons };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}
