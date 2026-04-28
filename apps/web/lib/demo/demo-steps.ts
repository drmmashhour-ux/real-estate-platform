import { investorScriptToDemoSteps } from "@/src/lib/demo/investor-script";

export type DemoStep = {
  id: string;
  title: string;
  description: string;
  /** Path only */
  route: string;
  highlight: string | null;
};

export type TourId = "standard_user_tour" | "investor_tour" | "guided_investor_tour";

const standardSteps: DemoStep[] = [
  {
    id: "welcome",
    title: "Welcome & overview",
    description:
      "Your command center connects every hub — CRM, deals, documents, and finance in one layer. Skip anytime.",
    route: "/dashboard/real-estate",
    highlight: '[data-tour="hub-header"]',
  },
  {
    id: "crm",
    title: "CRM pipeline",
    description: "Track leads, clients, and follow-ups in one organized pipeline.",
    route: "/dashboard/broker/crm",
    highlight: '[data-tour="crm-pipeline"]',
  },
  {
    id: "offers",
    title: "Offers & negotiations",
    description: "Create, review, and negotiate offers with full status history.",
    route: "/dashboard/offers",
    highlight: '[data-tour="offers-list"]',
  },
  {
    id: "contracts",
    title: "Contracts & signatures",
    description: "Move accepted deals into structured contract workflows with audit trails.",
    route: "/dashboard/contracts",
    highlight: null,
  },
  {
    id: "documents",
    title: "Document center",
    description: "Keep required files in secure shared deal rooms linked to each workflow.",
    route: "/dashboard/documents",
    highlight: null,
  },
  {
    id: "scheduling",
    title: "Scheduling",
    description: "Coordinate visits and appointments without leaving the platform.",
    route: "/dashboard/appointments",
    highlight: null,
  },
  {
    id: "notifications",
    title: "Notifications & task inbox",
    description: "Surface tasks and alerts so follow-ups don’t slip between deal stages.",
    route: "/dashboard/notifications",
    highlight: null,
  },
  {
    id: "finance",
    title: "Finance & analytics",
    description: "Track commissions, invoices, and payment records inside the same workspace.",
    route: "/dashboard/broker/commissions",
    highlight: null,
  },
  {
    id: "complete",
    title: "You’re set",
    description: "Explore hubs from the switcher anytime — restart the tour from Help or the demo menu.",
    route: "/dashboard/real-estate",
    highlight: null,
  },
];

const guidedInvestorSteps: DemoStep[] = investorScriptToDemoSteps() as DemoStep[];
const investorSteps: DemoStep[] = [
  {
    id: "inv_welcome",
    title: "Platform breadth",
    description:
      "LECIPM spans CRM, transactions, documents, messaging, and finance in one product layer for agencies and investors.",
    route: "/dashboard/real-estate",
    highlight: '[data-tour="hub-header"]',
  },
  {
    id: "inv_workflow",
    title: "Workflow integration",
    description:
      "Listings, offers, contracts, and deal rooms reference the same entities — built for multi-tenant scale.",
    route: "/dashboard/broker/crm",
    highlight: '[data-tour="crm-pipeline"]',
  },
  {
    id: "inv_docs",
    title: "Documents & compliance",
    description: "Shared deal rooms and audit trails reduce fragmentation for agencies and clients.",
    route: "/dashboard/documents",
    highlight: null,
  },
  {
    id: "inv_finance",
    title: "Finance layer",
    description:
      "Commissions, invoices, and revenue visibility — designed for finance oversight, not just CRM.",
    route: "/dashboard/broker/commissions",
    highlight: null,
  },
  {
    id: "inv_analytics",
    title: "Operational command center",
    description: "Leadership-ready signals across the transaction lifecycle — analytics and admin oversight.",
    route: "/dashboard/broker/crm",
    highlight: null,
  },
  {
    id: "inv_end",
    title: "Next steps",
    description: "Request access or book a deeper walkthrough — we’ll map your brokerage workflows.",
    route: "/guided-demo",
    highlight: null,
  },
];

const TOURS: Record<TourId, DemoStep[]> = {
  standard_user_tour: standardSteps,
  investor_tour: investorSteps,
  guided_investor_tour: guidedInvestorSteps,
};

export function getDemoSteps(tourId: TourId): DemoStep[] {
  return TOURS[tourId] ?? TOURS.standard_user_tour;
}

export function isTourId(value: string | null): value is TourId {
  return value === "standard_user_tour" || value === "investor_tour" || value === "guided_investor_tour";
}

export function resolveDemoRoute(route: string): string {
  return route;
}
