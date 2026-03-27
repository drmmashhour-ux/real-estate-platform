import Link from "next/link";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { prisma } from "@/lib/db";
import { DEMO_PROJECTS } from "@/lib/data/demo-projects";
import { predictUnitPrice } from "@/lib/ai/unit-pricing";

export default async function ComparePage() {
  const role = await getUserRole();
  const theme = getHubTheme("investments");
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, city: true, startingPrice: true, status: true, deliveryDate: true, featured: true },
    take: 6,
  }).catch(() => []);
  const list = (projects.length ? projects : DEMO_PROJECTS).slice(0, 4);

  return (
    <HubLayout title="Investments" hubKey="investments" navigation={hubNavigation.investments} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">Compare Projects</h1>
        <div className="grid gap-4 xl:grid-cols-2">
          {list.map((p: any) => {
            const unit = (p.units?.[0] ?? { id: "fallback", type: "1bed", price: p.startingPrice ?? 450000, size: 60, status: "available" });
            const pred = predictUnitPrice(p, unit);
            return (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{p.name}</p>
                    <p className="text-sm text-slate-400">{p.city}</p>
                  </div>
                  <span className="text-xs text-teal-300">{p.featured ? "Featured" : "Standard"}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/5 p-3"><p className="text-slate-500">Starting</p><p className="mt-1 text-white">${Number(p.startingPrice ?? 0).toLocaleString()}</p></div>
                  <div className="rounded-xl bg-white/5 p-3"><p className="text-slate-500">Predicted</p><p className="mt-1 text-teal-300">${pred.predictedDeliveryValue.toLocaleString()}</p></div>
                  <div className="rounded-xl bg-white/5 p-3"><p className="text-slate-500">Growth</p><p className="mt-1 text-white">{pred.predictedGrowthPercent.toFixed(1)}%</p></div>
                  <div className="rounded-xl bg-white/5 p-3"><p className="text-slate-500">Yield</p><p className="mt-1 text-white">{(pred.estimatedRentalYield * 100).toFixed(1)}%</p></div>
                </div>
                <Link href={`/projects/${p.id}`} className="mt-4 inline-block text-sm text-teal-400 hover:underline">View Project →</Link>
              </div>
            );
          })}
        </div>
      </div>
    </HubLayout>
  );
}
