import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { AUTOMATION_TRIGGER_CATALOG } from "@/modules/automation/automation-events.service";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AutomationTriggersPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/automation/triggers`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            Admin · triggers
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Trigger catalog</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Registry aligned with docs/ai/event-trigger-automation-spec.md — wiring expands per stage.
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#B3B3B3]">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Title</th>
                <th className="pb-2 pr-4">Source</th>
                <th className="pb-2 pr-4">Output</th>
                <th className="pb-2">Approval</th>
              </tr>
            </thead>
            <tbody>
              {AUTOMATION_TRIGGER_CATALOG.map((t) => (
                <tr key={t.id} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-mono text-xs text-white">{t.id}</td>
                  <td className="py-2 pr-4">{t.title}</td>
                  <td className="py-2 pr-4">{t.eventSource}</td>
                  <td className="py-2 pr-4">{t.output}</td>
                  <td className="py-2">{t.approvalRule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
