import municipalities from "@/lib/geo/data/quebec-municipalities.json";

/**
 * Municipality names from the Quebec open-data Répertoire des municipalités (MUN.csv).
 * @see https://donneesouvertes.affmunqc.net/repertoire/MUN.csv
 */

const LIST = municipalities as readonly string[];

function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

const KEYS = LIST.map((name) => ({ name, key: normalizeKey(name) }));

/**
 * Ranked suggestions for Quebec municipalities (accent-insensitive).
 * Free-text neighbourhoods and addresses still work when the user does not pick a suggestion.
 */
export function suggestQuebecMunicipalities(query: string, limit = 12): string[] {
  const raw = query.trim();
  if (raw.length < 1) return [];
  const q = normalizeKey(raw);
  const scored: { name: string; rank: number }[] = [];
  for (const { name, key } of KEYS) {
    let rank = 99;
    if (key.startsWith(q)) rank = 0;
    else if (key.split(/[\s'-]+/).some((w) => w.startsWith(q))) rank = 1;
    else if (key.includes(q)) rank = 2;
    else continue;
    scored.push({ name, rank });
  }
  scored.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, "fr-CA", { sensitivity: "base" }));
  return scored.slice(0, limit).map((x) => x.name);
}
