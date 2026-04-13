/**
 * Hub routing – default landing hub and accessible hubs by user role.
 */

export type UserWithRole = { role?: string } | null;

export function getDefaultHub(user: UserWithRole): string {
  if (!user) return "/";
  if (!user.role) return "/dashboard/real-estate";

  const r = String(user.role || "").toUpperCase();
  switch (r) {
    case "CONTENT_OPERATOR":
    case "LISTING_OPERATOR":
    case "OUTREACH_OPERATOR":
    case "SUPPORT_AGENT":
      return "/admin/team";
    case "ADMIN":
      return "/admin";
    case "TESTER":
      return "/dashboard/real-estate";
    case "BROKER":
      return "/dashboard/broker";
    case "HOST":
      return "/dashboard/bnhub";
    case "MORTGAGE_EXPERT":
    case "MORTGAGE_BROKER":
      return "/dashboard/expert";
    case "INSURANCE_BROKER":
      return "/dashboard/insurance";
    case "BUYER":
      return "/dashboard/buyer";
    case "SELLER_DIRECT":
      return "/dashboard/seller";
    case "INVESTOR":
      return "/dashboard/investments";
    default:
      return "/dashboard/real-estate";
  }
}

export type HubKey =
  | "bnhub"
  | "carhub"
  | "servicehub"
  | "investorhub"
  | "realEstate"
  | "financialHub"
  | "luxury"
  | "broker"
  | "investments"
  | "referrals"
  | "projects"
  | "admin";

/** Hubs the user is allowed to see in the switcher. Admin only for admin role; others get role-relevant + realEstate. */
export function getAccessibleHubs(user: UserWithRole): HubKey[] {
  const base: HubKey[] = ["bnhub", "realEstate", "financialHub", "luxury", "broker", "investments", "referrals", "projects"];
  if (!user) return [];
  const role = String(user.role || "").toUpperCase();
  if (role === "ADMIN") return [...base, "admin"];
  if (["CONTENT_OPERATOR", "LISTING_OPERATOR", "OUTREACH_OPERATOR", "SUPPORT_AGENT"].includes(role)) {
    return [...base, "admin"];
  }
  return [...base];
}

export const HUB_PATHS: Record<HubKey, string> = {
  bnhub: "/dashboard/bnhub",
  carhub: "/hub/carhub",
  servicehub: "/hub/servicehub",
  investorhub: "/hub/investorhub",
  realEstate: "/dashboard/real-estate",
  financialHub: "/financial-hub",
  luxury: "/dashboard/luxury",
  broker: "/dashboard/broker",
  investments: "/dashboard/investments",
  referrals: "/dashboard/referrals",
  projects: "/dashboard/projects",
  admin: "/admin",
};
