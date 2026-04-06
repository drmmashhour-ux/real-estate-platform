/**
 * Optional deep links to airline / tour-operator sites (affiliate or direct).
 * Configure in env — never scrape; send users to official booking flows you are allowed to use.
 */

export type TravelPartnerLink = {
  id: string;
  label: string;
  description: string;
  href: string;
};

const DEFAULT_DISCLOSURE =
  "Links open official airline or tour sites. If you use affiliate or referral programs, ensure those links are approved and disclosed as required in your jurisdiction.";

function safeHttpsUrl(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Ordered list — only entries with valid https URLs are returned. */
export function getTravelPartnerLinks(): TravelPartnerLink[] {
  const candidates: TravelPartnerLink[] = [];

  const westjet = safeHttpsUrl(process.env.TRAVEL_PARTNER_WESTJET_VACATIONS_URL);
  if (westjet) {
    candidates.push({
      id: "westjet_vacations",
      label: "WestJet Vacations",
      description: "Packages & sun destinations on the official site",
      href: westjet,
    });
  }

  const sunwing = safeHttpsUrl(process.env.TRAVEL_PARTNER_SUNWING_URL);
  if (sunwing) {
    candidates.push({
      id: "sunwing",
      label: "Sunwing",
      description: "Vacation packages on the official site",
      href: sunwing,
    });
  }

  const flightMeta = safeHttpsUrl(process.env.TRAVEL_PARTNER_FLIGHT_SEARCH_URL);
  if (flightMeta) {
    candidates.push({
      id: "flight_search",
      label: "Compare flights",
      description: "Metasearch or airline hub you trust (official partner link)",
      href: flightMeta,
    });
  }

  const packagesMeta = safeHttpsUrl(process.env.TRAVEL_PARTNER_PACKAGE_SEARCH_URL);
  if (packagesMeta) {
    candidates.push({
      id: "package_search",
      label: "Browse packages",
      description: "Tour operator or OTA landing page you partner with",
      href: packagesMeta,
    });
  }

  return candidates;
}

export function getTravelPartnerDisclosure(): string {
  const o = process.env.TRAVEL_PARTNER_DISCLOSURE?.trim();
  return o && o.length > 20 ? o : DEFAULT_DISCLOSURE;
}

export function getTravelAiStaysCtaPath(): string {
  return "/bnhub/stays";
}
