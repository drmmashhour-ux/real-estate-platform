/**
 * Featured project logic: premium = featured, basic = not, trial = optional, featuredUntil expiry.
 */

const MONTREAL_COORDS = { lat: 45.5017, lng: -73.5673 };
const LAVAL_COORDS = { lat: 45.6066, lng: -73.7243 };

type ProjectWithSub = {
  featured?: boolean | null;
  featuredUntil?: Date | string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  subscription?: { plan?: string } | null;
};

export function isFeaturedEffective(project: ProjectWithSub, now: Date = new Date()): boolean {
  const featuredFlag = project.featured === true;
  const featuredUntil = project.featuredUntil
    ? new Date(project.featuredUntil)
    : null;
  const notExpired = !featuredUntil || featuredUntil > now;
  const premiumPlan = project.subscription?.plan === "premium";
  return (featuredFlag && notExpired) || premiumPlan;
}

export function getProjectCoords(project: {
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
}): { lat: number; lng: number } {
  if (
    project.latitude != null &&
    project.longitude != null &&
    !Number.isNaN(project.latitude) &&
    !Number.isNaN(project.longitude)
  ) {
    return { lat: project.latitude, lng: project.longitude };
  }
  const city = (project.city ?? "").toLowerCase();
  if (city === "laval") return LAVAL_COORDS;
  return MONTREAL_COORDS;
}

export function sortProjectsByFeaturedAndPremium<T extends ProjectWithSub>(projects: T[]): T[] {
  const now = new Date();
  return [...projects].sort((a, b) => {
    const aFeat = isFeaturedEffective(a, now);
    const bFeat = isFeaturedEffective(b, now);
    if (aFeat && !bFeat) return -1;
    if (!aFeat && bFeat) return 1;
    const aPremium = a.subscription?.plan === "premium";
    const bPremium = b.subscription?.plan === "premium";
    if (aPremium && !bPremium) return -1;
    if (!aPremium && bPremium) return 1;
    return 0;
  });
}
