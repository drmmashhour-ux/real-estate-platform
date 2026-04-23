/** Parse UTM fields from FormData (listing inquiry, booking request, etc.). */

export type UtmTriplet = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
};

export function parseUtmFromFormData(formData: FormData): UtmTriplet {
  const s = String(formData.get("utm_source") ?? "").trim();
  const m = String(formData.get("utm_medium") ?? "").trim();
  const c = String(formData.get("utm_campaign") ?? "").trim();
  const source = s || null;
  const medium = m || null;
  const campaign = c || null;
  return {
    utmSource: source,
    utmMedium: medium,
    utmCampaign: campaign,
    source,
    medium,
    campaign,
  };
}

export function parseUtmFromSearchParams(searchParams: Record<string, string | string[] | undefined>): UtmTriplet {
  const g = (k: string) => {
    const v = searchParams[k];
    const raw = Array.isArray(v) ? v[0] : v;
    const s = typeof raw === "string" ? raw.trim() : "";
    return s || null;
  };
  const source = g("utm_source");
  const medium = g("utm_medium");
  const campaign = g("utm_campaign");
  return {
    utmSource: source,
    utmMedium: medium,
    utmCampaign: campaign,
    source,
    medium,
    campaign,
  };
}
