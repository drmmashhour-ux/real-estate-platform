/** Single slide in the scripted investor walk-through (fake copy — no live user IDs). */


export type InvestorScriptSlide = {


  id: string;


  title: string;


  text: string;


  /** App-relative path (`withCountryPrefix` applied by routing). */


  route: string;


};


export type InvestorMappedStep = {


  id: string;


  title: string;


  description: string;


  route: string;


  highlight: null;


};


/** Structured investor narrative — aligned with primary LECIPM hubs. */
export const investorScript: InvestorScriptSlide[] = [
  {
    id: "intro",
    title: "Platform Overview",
    text: "LECIPM is an AI-driven real estate marketplace that unifies discovery, brokerage workflows, BNHub rentals, and admin oversight — designed as a regulated multi-hub marketplace layer.",
    route: "/",
  },
  {
    id: "search",
    title: "Smart Search",
    text: "Users search and discover listings with filters tuned for resale and rentals; demo payloads are simulated — no tenant data is surfaced in this scripted path.",
    route: "/listings",
  },
  {
    id: "listing",
    title: "Listing Intelligence",
    text: "Each listing emphasizes structured commerce fields; enrichment and scoring hooks exist in-platform — `/listing/demo` is a scripted placeholder listing id.",
    route: "/listing/demo",
  },
  {
    id: "bnhub",
    title: "Short-Term Rentals (BNHub)",
    text: "BNHub routes hosts through calendars, payouts, and trust primitives — scripted navigation does not open live payouts or PSP captures.",
    route: "/bnhub",
  },
  {
    id: "dashboard",
    title: "Broker Dashboard",
    text: "Brokers steer pipelines, commissions, and campaigns inside LECIPM dashboards connected to brokerage CRM and deal workspaces.",
    route: "/dashboard/broker",
  },
  {
    id: "admin",
    title: "Admin Control",
    text: "Admins supervise experiments, hubs, and risk primitives — scripted mode is read/navigate oriented; avoids irreversible mutations.",
    route: "/dashboard/admin",
  },
];

export function investorScriptToDemoSteps(slides: readonly InvestorScriptSlide[] = investorScript): InvestorMappedStep[] {
  return slides.map((s) => ({
    id: s.id,
    title: s.title,

    description: s.text,

    route: s.route,

    highlight: null as const,

  }));
}
