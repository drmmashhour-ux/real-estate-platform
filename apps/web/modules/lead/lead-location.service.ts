/**
 * Extract structured lead location — never invent cities or provinces.
 */

import { extractEvaluationSnapshot } from "@/lib/leads/timeline-helpers";
import type { LeadLocation, LeadLocationConfidenceLevel, LeadLocationSource } from "./lead-location.types";

export type ExtractLeadLocationInput = {
  message: string;
  purchaseRegion?: string | null;
  aiExplanation?: unknown;
  /** Explicit form fields (highest trust when present) */
  city?: string | null;
  province?: string | null;
  area?: string | null;
  postalCode?: string | null;
  address?: string | null;
  country?: string | null;
};

function normProvinceToken(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

/** Normalize to ISO-like province codes where possible (CA focus). */
export function normalizeProvince(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const k = normProvinceToken(raw);
  const map: Record<string, string> = {
    qc: "QC",
    pq: "QC",
    quebec: "QC",
    "quebec-province": "QC",
    on: "ON",
    ontario: "ON",
    bc: "BC",
    "british columbia": "BC",
    ab: "AB",
    alberta: "AB",
    mb: "MB",
    manitoba: "MB",
    sk: "SK",
    saskatchewan: "SK",
    ns: "NS",
    "nova scotia": "NS",
    nb: "NB",
    "new brunswick": "NB",
    nl: "NL",
    pe: "PE",
    yt: "YT",
    nt: "NT",
    nu: "NU",
  };
  const compact = k.replace(/\./g, "").replace(/\s+/g, " ");
  if (map[compact]) return map[compact];
  const t = raw.trim();
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
  return null;
}

export function normalizeCanadianPostal(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const x = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/i.test(x)) return `${x.slice(0, 3)} ${x.slice(3)}`;
  return raw.trim().slice(0, 16);
}

/** Derive province from Canadian postal FSA only when postal is explicitly provided (no city fabrication). */
export function provinceFromCanadianPostal(postal: string | null | undefined): string | null {
  if (!postal?.trim()) return null;
  const compact = postal.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/i.test(compact)) return null;
  const fsa = compact.slice(0, 3);
  const c = fsa[0]!;
  const map: Record<string, string> = {
    A: "NL",
    B: "NS",
    C: "PE",
    E: "NB",
    G: "QC",
    H: "QC",
    J: "QC",
    K: "ON",
    L: "ON",
    M: "ON",
    N: "ON",
    P: "ON",
    R: "MB",
    S: "SK",
    T: "AB",
    V: "BC",
    X: "NT",
    Y: "YT",
  };
  return map[c] ?? null;
}

function extractImmoListingLocation(aiExplanation: unknown): string | null {
  if (!aiExplanation || typeof aiExplanation !== "object") return null;
  const o = aiExplanation as Record<string, unknown>;
  const immo = o.immoContact as Record<string, unknown> | undefined;
  const loc = immo?.location ?? o.listingLocation;
  if (typeof loc === "string" && loc.trim()) return loc.trim();
  return null;
}

/** Split common "City, QC" listing lines — conservative. */
export function splitListingLocationLine(line: string): { city?: string; province?: string } {
  const t = line.trim();
  if (!t || t === "—") return {};
  const parts = t.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const maybeProv = normalizeProvince(parts[parts.length - 1] ?? "");
    if (maybeProv && parts.length >= 2) {
      return { city: parts.slice(0, -1).join(", "), province: maybeProv };
    }
    return { city: parts[0] };
  }
  return { city: parts[0] };
}

export function extractLeadLocation(input: ExtractLeadLocationInput): LeadLocation {
  const explicitCity = input.city?.trim() || null;
  const explicitProvince = normalizeProvince(input.province);
  const explicitPostal = normalizeCanadianPostal(input.postalCode);
  const explicitArea = input.area?.trim() || null;
  const explicitCountry = input.country?.trim() || null;

  let city = explicitCity;
  let province = explicitProvince ?? null;
  let area = explicitArea;
  let postalCode = explicitPostal;
  let source: LeadLocationSource = "partial";
  let confidenceLevel: LeadLocationConfidenceLevel = "low";

  if (explicitCity || explicitProvince || explicitPostal || explicitArea) {
    source = "user_input";
    if (explicitCity && (explicitProvince || explicitPostal)) confidenceLevel = "high";
    else if (explicitCity || explicitProvince || explicitPostal) confidenceLevel = "medium";
    else confidenceLevel = "low";
  }

  const snap = extractEvaluationSnapshot(input.aiExplanation);
  if (!city && snap?.city?.trim()) {
    city = snap.city!.trim();
    source = "inferred";
    confidenceLevel = snap.address ? "medium" : "low";
  }
  if (!province && snap?.province?.trim()) {
    province = normalizeProvince(snap.province) ?? province;
    if (source === "partial") confidenceLevel = confidenceLevel === "high" ? confidenceLevel : "medium";
  }

  const purchase = input.purchaseRegion?.trim();
  if (purchase) {
    const np = normalizeProvince(purchase);
    if (!province && np) province = np;
    if (!city && purchase.includes(",")) {
      const head = purchase.split(",")[0]?.trim();
      if (head && !normProvinceToken(head).match(/^(qc|on|bc)$/)) city = head;
    } else if (!city && !purchase.includes(",") && !np) {
      city = purchase;
      source = source === "user_input" ? "user_input" : "partial";
      confidenceLevel = "low";
    }
  }

  const immoLoc = extractImmoListingLocation(input.aiExplanation);
  if (immoLoc) {
    const parsed = splitListingLocationLine(immoLoc);
    if (!city && parsed.city) {
      city = parsed.city;
      if (source !== "user_input") {
        source = "partial";
        confidenceLevel = confidenceLevel === "high" ? confidenceLevel : "medium";
      }
    }
    if (!province && parsed.province) {
      province = parsed.province;
    }
  }

  if (!city && input.message) {
    const m = input.message.match(/City:\s*([^\n]+)/i);
    if (m?.[1]) {
      const head = m[1].trim().split(",")[0]?.trim();
      if (head) {
        city = head;
        source = "partial";
        confidenceLevel = "low";
      }
    }
  }

  if (!province && postalCode) {
    const p = provinceFromCanadianPostal(postalCode);
    if (p) province = p;
  }

  if (!city && !province && !postalCode && !area) {
    return {
      country: explicitCountry,
      confidenceLevel: "low",
      source: "partial",
    };
  }

  return {
    country: explicitCountry,
    province,
    city,
    area,
    postalCode,
    lat: null,
    lng: null,
    confidenceLevel,
    source,
  };
}
