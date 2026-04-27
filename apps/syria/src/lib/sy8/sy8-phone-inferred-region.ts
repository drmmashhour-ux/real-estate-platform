import { SYRIA_STATES, type SyriaStateEn } from "@/lib/syria/states";

/**
 * Best-effort mapping from Syrian **landline** national destination (after +963) to a governorate
 * `state` / `governorate` label (same English keys as `SYRIA_STATES` / `SyriaProperty.state`).
 * **Mobile** numbers (+963 9… / 0 9…) return `null` (no region signal).
 */
const PREFIX2_TO_STATE: Record<string, SyriaStateEn> = {
  // national significant prefix after country code, without trunk 0
  "11": "Damascus",
  "12": "Rif Dimashq",
  "13": "Rif Dimashq",
  "14": "Rif Dimashq",
  "15": "Rif Dimashq",
  "21": "Aleppo",
  "22": "Aleppo",
  "25": "Latakia",
  "31": "Homs",
  "33": "Hama",
  "34": "Homs",
  "41": "Tartus",
  "43": "Daraa",
  "45": "As-Suwayda",
  "51": "Deir ez-Zor",
  "52": "Al-Hasakah",
};

function isKnownState(s: string): s is SyriaStateEn {
  return (SYRIA_STATES as readonly string[]).includes(s);
}

export function inferSyriaStateEnFromPhone(phone: string | null | undefined): SyriaStateEn | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  let rest = digits;
  if (rest.startsWith("963")) rest = rest.slice(3);
  if (rest.startsWith("0")) rest = rest.slice(1);
  // Mobile: 9X … (national)
  if (rest.startsWith("9")) return null;
  if (rest.length < 2) return null;
  const two = rest.slice(0, 2);
  const hit = PREFIX2_TO_STATE[two];
  if (hit && isKnownState(hit)) return hit;
  return null;
}

/** Normalize for comparison: trim + first governing token. */
function normState(s: string | null | undefined): string {
  return (s ?? "").trim();
}

/**
 * |difference| in implied trust when listing state/governorate disagrees with landline-inferred governorate.
 * Returns 0 if phone gives no region signal or if either side is blank.
 */
export function locationPhoneStateMismatchPoints(input: {
  propertyState: string | null | undefined;
  propertyGovernorate: string | null | undefined;
  ownerPhone: string | null | undefined;
}): 0 | 2 {
  const inferred = inferSyriaStateEnFromPhone(input.ownerPhone);
  if (!inferred) return 0;
  const a = normState(input.propertyState);
  const b = normState(input.propertyGovernorate);
  const pick = a || b;
  if (!pick) return 0;
  if (pick === inferred) return 0;
  // Soft match: same “family” (e.g. Rif vs Damascus) — still flag if clearly different
  return 2;
}
