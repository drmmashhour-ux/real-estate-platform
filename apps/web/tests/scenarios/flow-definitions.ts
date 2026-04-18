/**
 * User-flow definitions — HTTP smoke only (full E2E in Playwright separately).
 */
export type FlowStep = { name: string; path: string };

export type FlowDefinition = {
  id: string;
  label: string;
  steps: FlowStep[];
};

export const guestFlow: FlowDefinition = {
  id: "guest_marketplace",
  label: "Guest: home → listings → BNHub → search",
  steps: [
    { name: "home", path: "/en/ca" },
    { name: "listings", path: "/en/ca/listings" },
    { name: "bnhub", path: "/en/ca/bnhub" },
    { name: "search", path: "/en/ca/search" },
  ],
};

export const hostFlow: FlowDefinition = {
  id: "host_surfaces",
  label: "Host: dashboard hub surfaces (auth walls expected)",
  steps: [
    { name: "host_dashboard", path: "/en/ca/dashboard/host" },
    { name: "bnhub_host", path: "/en/ca/bnhub/host/dashboard" },
  ],
};

export const brokerFlow: FlowDefinition = {
  id: "broker_surfaces",
  label: "Broker: CRM / deals entry (auth walls expected)",
  steps: [
    { name: "broker_home", path: "/en/ca/dashboard/broker" },
    { name: "broker_leads", path: "/en/ca/dashboard/broker/clients" },
  ],
};

export const adminFlow: FlowDefinition = {
  id: "admin_surfaces",
  label: "Admin: fraud → growth → users (auth walls expected)",
  steps: [
    { name: "admin_root", path: "/en/ca/admin" },
    { name: "admin_fraud", path: "/en/ca/admin/fraud" },
    { name: "admin_growth", path: "/en/ca/admin/growth" },
    { name: "admin_users", path: "/en/ca/admin/users" },
    { name: "admin_security", path: "/en/ca/admin/security" },
  ],
};

export const marketingFlow: FlowDefinition = {
  id: "marketing_surfaces",
  label: "Marketing: pricing → blog pipeline",
  steps: [
    { name: "pricing", path: "/en/ca/pricing" },
    { name: "seo_blog_admin", path: "/en/ca/admin/seo-blog" },
  ],
};

export const allFlowDefinitions: FlowDefinition[] = [
  guestFlow,
  hostFlow,
  brokerFlow,
  adminFlow,
  marketingFlow,
];
