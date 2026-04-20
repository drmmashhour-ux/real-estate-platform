import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { describeDefaultModes, getEffectiveAutopilotStage } from "@/modules/autopilot/autopilot-mode.service";
import { listCataloguedAutopilotActions } from "@/modules/autopilot/autopilot-actions.service";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AutopilotModesPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/automation/autopilot`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const stage = getEffectiveAutopilotStage();
  const modes = describeDefaultModes();
  const actions = listCataloguedAutopilotActions();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            Admin · autopilot
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Autopilot modes</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Effective stage <span className="text-white">{stage}</span> via FEATURE_LECIPM_AUTOMATION_STAGE. BNHub pricing execution
            remains governed by autonomy / pricing mode — not this page.
          </p>
        </div>
        <Link
          href={`/${locale}/${country}/dashboard/admin/automation`}
          className="text-sm font-medium text-premium-gold hover:underline"
        >
          ← Automation center
        </Link>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Hub descriptors</h2>
        <ul className="mt-4 space-y-3 text-sm text-[#B3B3B3]">
          {modes.map((m) => (
            <li key={m.hub} className="rounded-lg border border-white/10 bg-black/40 p-3">
              <span className="text-white">{m.hub}</span> — {m.disclaimer}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Catalogued action classes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-[#B3B3B3]">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <th className="pb-2 pr-4">Key</th>
                <th className="pb-2 pr-4">Hub</th>
                <th className="pb-2 pr-4">Risk</th>
                <th className="pb-2 pr-4">Approval</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.key} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-mono text-xs text-white">{a.key}</td>
                  <td className="py-2 pr-4">{a.hub}</td>
                  <td className="py-2 pr-4">{a.risk}</td>
                  <td className="py-2 pr-4">{a.requiresApproval ? "yes" : "no"}</td>
                  <td className="py-2">{a.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
