/**
 * Deterministic Property UID generation.
 * Same property (cadastre + normalized address + municipality + province) => same property_uid.
 */

import { createHash } from "crypto";
import { normalizeAddress, normalizeMunicipality, normalizeProvince, normalizeCadastreForUid } from "./normalize";

const UID_PREFIX = "pid";
const HASH_LEN = 16;

export interface PropertyUidInput {
  cadastreNumber?: string | null;
  officialAddress: string;
  municipality?: string | null;
  province?: string | null;
  country?: string | null;
}

/**
 * Generate a deterministic property_uid from canonical fields.
 * Normalizes address, cadastre, municipality, province before hashing.
 */
export function generatePropertyUid(input: PropertyUidInput): string {
  const cadastre = normalizeCadastreForUid(input.cadastreNumber) || "";
  const normalizedAddress = normalizeAddress(input.officialAddress) || "";
  const municipality = normalizeMunicipality(input.municipality) || "";
  const province = normalizeProvince(input.province) || "";
  const country = (input.country && String(input.country).trim()) || "US";

  const payload = [cadastre, normalizedAddress, municipality, province, country]
    .filter(Boolean)
    .join("|");

  const hash = createHash("sha256").update(payload, "utf8").digest("hex").slice(0, HASH_LEN);
  return `${UID_PREFIX}_${hash}`;
}
