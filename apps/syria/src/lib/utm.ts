/** Parse UTM fields from FormData (listing inquiry, booking request, etc.). */

export type UtmTriplet = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

export function parseUtmFromFormData(formData: FormData): UtmTriplet {
  const s = String(formData.get("utm_source") ?? "").trim();
  const m = String(formData.get("utm_medium") ?? "").trim();
  const c = String(formData.get("utm_campaign") ?? "").trim();
  return {
    utmSource: s || null,
    utmMedium: m || null,
    utmCampaign: c || null,
  };
}

export function parseUtmFromSearchParams(searchParams: Record<string, string | string[] | undefined>): UtmTriplet {
  const g = (k: string) => {
    const v = searchParams[k];
    const raw = Array.isArray(v) ? v[0] : v;
    const s = typeof raw === "string" ? raw.trim() : "";
    return s || null;
  };
  return {
    utmSource: g("utm_source"),
    utmMedium: g("utm_medium"),
    utmCampaign: g("utm_campaign"),
  };
}
