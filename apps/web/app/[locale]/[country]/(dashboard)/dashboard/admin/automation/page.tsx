import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { buildAdminDailyAiSummary } from "@/modules/ai-assist/admin-daily-summary.service";
import { describeDefaultModes } from "@/modules/autopilot/autopilot-mode.service";
import { getEffectiveAutopilotStage } from "@/modules/autopilot/autopilot-mode.service";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AutomationCenterPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/automation`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const stage = getEffectiveAutopilotStage();
  const modes = describeDefaultModes();
  const daily = await buildAdminDailyAiSummary();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            LECIPM · automation center
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Automation &amp; AI assist</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Stage {stage} — recommendations-first; governance and hub policies override automation. See{" "}
            <span className="text-white">docs/ai/ai-automation-master-plan.md</span> for domain scope.
          </p>
        </div>
        <Link
          href={`/${locale}/${country}/dashboard/admin`}
          className="text-sm font-medium text-premium-gold hover:underline"
        >
          ← Admin overview
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { slug: "recommendations", label: "AI recommendations" },
          { slug: "autopilot", label: "Autopilot modes" },
          { slug: "triggers", label: "Trigger catalog" },
          { slug: "approvals", label: "Approval queue" },
        ].map((x) => (
          <Link
            key={x.slug}
            href={`/${locale}/${country}/dashboard/admin/automation/${x.slug}`}
            className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm font-medium text-premium-gold hover:bg-black/50"
          >
            {x.label} →
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Hub modes (effective stage {stage})</h2>
        <ul className="mt-4 space-y-3 text-sm text-[#B3B3B3]">
          {modes.map((m) => (
            <li key={m.hub} className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="font-medium text-white">{m.label}</div>
              <div className="mt-1 text-xs text-[#737373]">{m.disclaimer}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Daily KPI digest (deterministic)</h2>
        <p className="mt-1 text-xs text-[#737373]">Sourced from admin analytics — not forecast or invented metrics.</p>
        <div className="mt-4 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-xs text-[#B3B3B3]">
          {daily.ok ? daily.value.items[0]?.body : `Unavailable: ${daily.error}`}
        </div>
      </section>
    </div>
  );
}
