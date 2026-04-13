import type { Metadata } from "next";
import path from "path";
import { notFound } from "next/navigation";
import { collectRoutesUnder } from "@/lib/dev/collect-app-directory-routes";
import {
  HUB_LINKS_ADMIN,
  HUB_LINKS_DASHBOARDS,
  HUB_LINKS_PUBLIC,
  HUB_LINKS_SUPPORT,
  HUB_LINKS_TOOLS,
} from "@/lib/marketing/platform-hub-links";
import { HubAtlasView } from "./hub-atlas-view";

export const metadata: Metadata = {
  title: "Dev — platform route atlas",
  robots: { index: false, follow: false },
};

export default async function DevHubAtlasPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const appDir = path.join(process.cwd(), "app");

  const [
    dashboardRoutes,
    adminRoutes,
    brokerRoutes,
    bnhubPublicRoutes,
    agentRoutes,
    sellerPortalRoutes,
    investorPortalRoutes,
    demoRoutes,
  ] = await Promise.all([
    collectRoutesUnder(path.join(appDir, "(dashboard)", "dashboard"), "/dashboard"),
    collectRoutesUnder(path.join(appDir, "admin"), "/admin"),
    collectRoutesUnder(path.join(appDir, "broker"), "/broker"),
    collectRoutesUnder(path.join(appDir, "bnhub"), "/bnhub"),
    collectRoutesUnder(path.join(appDir, "agent"), "/agent"),
    collectRoutesUnder(path.join(appDir, "seller"), "/seller"),
    collectRoutesUnder(path.join(appDir, "investor"), "/investor"),
    collectRoutesUnder(path.join(appDir, "demo"), "/demo"),
  ]);

  const marketingExtras = [
    ...HUB_LINKS_PUBLIC,
    ...HUB_LINKS_TOOLS,
    ...HUB_LINKS_DASHBOARDS,
    ...HUB_LINKS_SUPPORT,
    ...HUB_LINKS_ADMIN,
  ].map((l) => ({ href: l.href, label: l.label }));

  const sections = [
    {
      id: "marketing",
      title: "Marketing & hub entry points",
      description: "Curated shortcuts (navbar / footer). Many work signed out; dashboards redirect to login.",
      routes: [] as string[],
      extras: marketingExtras,
    },
    {
      id: "bnhub",
      title: "BNHUB (public app surface)",
      description: "Guest/host flows under /bnhub — from filesystem scan.",
      routes: bnhubPublicRoutes,
    },
    {
      id: "broker",
      title: "Broker (signed-in broker surface)",
      description: "Routes under /broker (profile, dashboard, apply, etc.).",
      routes: brokerRoutes,
    },
    {
      id: "dashboard",
      title: "User dashboards (/dashboard/*)",
      description: "All app router pages under the main dashboard segment — buyer, seller, BNHUB host tools, finance, AI, embedded admin KPIs, etc.",
      routes: dashboardRoutes,
    },
    {
      id: "agent",
      title: "Agent portal (/agent/*)",
      description: "Separate agent surface if enabled in your deployment.",
      routes: agentRoutes,
    },
    {
      id: "seller-portal",
      title: "Seller portal (/seller/*)",
      description: "Legacy or alternate seller entry (e.g. /seller/dashboard).",
      routes: sellerPortalRoutes,
    },
    {
      id: "investor-portal",
      title: "Investor portal (/investor/*)",
      description: "Investor-facing routes (may include route groups).",
      routes: investorPortalRoutes,
    },
    {
      id: "demo",
      title: "Demo dashboard (/demo/*)",
      description: "Demo or sandbox flows.",
      routes: demoRoutes,
    },
    {
      id: "admin",
      title: "Staff admin (/admin/*)",
      description: "Full operations console — requires ADMIN or ACCOUNTANT role.",
      routes: adminRoutes,
    },
  ].filter((s) => s.routes.length > 0 || (s.extras?.length ?? 0) > 0);

  return <HubAtlasView sections={sections} />;
}
