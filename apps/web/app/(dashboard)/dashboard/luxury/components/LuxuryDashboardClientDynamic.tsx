"use client";

import dynamic from "next/dynamic";
import type { HubTheme } from "@/lib/hub/themes";

const LuxuryDashboardClient = dynamic(
  () => import("./LuxuryDashboardClient").then((m) => m.LuxuryDashboardClient),
  { ssr: false, loading: () => <div className="rounded-xl border border-white/10 p-6 text-slate-500">Loading…</div> }
);

export function LuxuryDashboardClientDynamic({ theme }: { theme: HubTheme }) {
  return <LuxuryDashboardClient theme={theme} />;
}
