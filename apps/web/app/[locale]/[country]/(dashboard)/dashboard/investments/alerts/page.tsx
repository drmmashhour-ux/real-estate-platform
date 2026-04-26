import Link from "next/link";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export default async function InvestmentAlertsPage() {
  const role = await getUserRole();
  const theme = getHubTheme("investments");
  const alerts = await prisma.projectAlert.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []);
  return (
    <HubLayout title="Investments" hubKey="investments" navigation={hubNavigation.investments} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">Investor Alerts</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {alerts.length ? alerts.map((a: any) => (
            <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-semibold text-white">{a.alertType.replace(/-/g, " ")}</p>
              <p className="mt-1 text-sm text-slate-400">{a.city ?? "Any city"}</p>
              <p className="mt-2 text-sm text-slate-300">{a.isActive ? "Active" : "Paused"}</p>
            </div>
          )) : <p className="text-slate-400">No alerts yet.</p>}
        </div>
        <Link href="/dashboard/projects/alerts" className="text-sm text-teal-400 hover:underline">Manage project alerts →</Link>
      </div>
    </HubLayout>
  );
}
