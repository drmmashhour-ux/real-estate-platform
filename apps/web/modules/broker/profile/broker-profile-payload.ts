/**
 * Normalize persisted broker profile JSON — defensive defaults.
 */

import type {
  BrokerCapacityProfile,
  BrokerLanguageProfile,
  BrokerLeadPreference,
  BrokerServiceArea,
  BrokerServiceProfileStored,
  BrokerSpecialization,
} from "./broker-profile.types";

const MAX_AREAS = 24;
const MAX_SPECS = 16;
const MAX_PREFS = 12;
const MAX_LANGS = 12;

export function emptyStoredProfile(): BrokerServiceProfileStored {
  return {
    serviceAreas: [],
    specializations: [],
    leadPreferences: [],
    languages: [],
    capacity: { acceptingNewLeads: true },
    notes: null,
    adminVerifiedAt: null,
  };
}

function clampStr(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

export function parseBrokerServiceProfileStored(raw: unknown): BrokerServiceProfileStored {
  if (!raw || typeof raw !== "object") return emptyStoredProfile();
  const o = raw as Record<string, unknown>;

  const serviceAreas: BrokerServiceArea[] = Array.isArray(o.serviceAreas)
    ? o.serviceAreas.slice(0, MAX_AREAS).map((x) => {
        const a = x as Record<string, unknown>;
        const city = clampStr(a.city, 120);
        if (!city) return null;
        const pl = a.priorityLevel === "secondary" || a.priorityLevel === "occasional" ? a.priorityLevel : "primary";
        return {
          country: a.country ? clampStr(a.country, 64) : null,
          city,
          area: a.area ? clampStr(a.area, 120) : null,
          priorityLevel: pl,
        } as BrokerServiceArea;
      })
    : [];
  const specializations: BrokerSpecialization[] = Array.isArray(o.specializations)
    ? o.specializations.slice(0, MAX_SPECS).map((x) => {
        const a = x as Record<string, unknown>;
        const propertyType = clampStr(a.propertyType, 32) as BrokerSpecialization["propertyType"];
        const src =
          a.confidenceSource === "observed" || a.confidenceSource === "admin_verified"
            ? a.confidenceSource
            : "self_declared";
        return {
          propertyType: (propertyType || "residential") as BrokerSpecialization["propertyType"],
          confidenceSource: src,
          enabled: a.enabled !== false,
        };
      })
    : [];
  const leadPreferences: BrokerLeadPreference[] = Array.isArray(o.leadPreferences)
    ? o.leadPreferences.slice(0, MAX_PREFS).map((x) => {
        const a = x as Record<string, unknown>;
        const leadType = clampStr(a.leadType, 24) as BrokerLeadPreference["leadType"];
        const priorityLevel =
          a.priorityLevel === "preferred" || a.priorityLevel === "avoid" ? a.priorityLevel : "standard";
        return {
          leadType: (leadType || "buyer") as BrokerLeadPreference["leadType"],
          priorityLevel,
        };
      })
    : [];
  const languages: BrokerLanguageProfile[] = Array.isArray(o.languages)
    ? o.languages.slice(0, MAX_LANGS).map((x) => {
        const a = x as Record<string, unknown>;
        const code = clampStr(a.code, 12).toLowerCase() || "en";
        const label = clampStr(a.label, 48) || code;
        const proficiency =
          a.proficiency === "native" || a.proficiency === "fluent" || a.proficiency === "working"
            ? a.proficiency
            : "working";
        return { code, label, proficiency };
      })
    : [];

  let capacity: BrokerCapacityProfile = { acceptingNewLeads: true };
  if (o.capacity && typeof o.capacity === "object") {
    const c = o.capacity as Record<string, unknown>;
    capacity = {
      acceptingNewLeads: c.acceptingNewLeads !== false,
      maxActiveLeads: typeof c.maxActiveLeads === "number" ? Math.min(500, Math.max(0, c.maxActiveLeads)) : null,
      preferredActiveRange:
        c.preferredActiveRange && typeof c.preferredActiveRange === "object"
          ? {
              min: typeof (c.preferredActiveRange as Record<string, unknown>).min === "number"
                ? (c.preferredActiveRange as { min: number }).min
                : undefined,
              max: typeof (c.preferredActiveRange as Record<string, unknown>).max === "number"
                ? (c.preferredActiveRange as { max: number }).max
                : undefined,
            }
          : null,
    };
  }

  return {
    serviceAreas: serviceAreas.filter(Boolean) as BrokerServiceArea[],
    specializations,
    leadPreferences,
    languages,
    capacity,
    notes: o.notes != null ? clampStr(o.notes, 4000) : null,
    adminVerifiedAt:
      typeof o.adminVerifiedAt === "string" && o.adminVerifiedAt.length > 0 ? o.adminVerifiedAt.slice(0, 40) : null,
  };
}

export function serializeStoredProfile(s: BrokerServiceProfileStored): Record<string, unknown> {
  return { ...s };
}
