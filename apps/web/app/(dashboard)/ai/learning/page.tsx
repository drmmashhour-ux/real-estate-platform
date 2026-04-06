import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

export default async function AiLearningPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/ai/learning");
  if (!(await isPlatformAdmin(userId))) redirect("/ai");

  const rows = await prisma.aiRulePerformance.findMany({
    orderBy: { ruleName: "asc" },
    select: {
      ruleName: true,
      total: true,
      successCount: true,
      failureCount: true,
    },
  });

  const withRate = rows.map((r) => ({
    ...r,
    successRatePct: r.total > 0 ? Math.round((r.successCount / r.total) * 1000) / 10 : null,
  }));

  return (
    <div className="rounded-xl border border-white/10 bg-black p-6">
      <h1 className="text-lg font-semibold text-white">AI rule learning</h1>
      <p className="mt-1 text-sm text-white/50">
        Host Autopilot feedback aggregates — which rules tend to succeed or fail after host actions.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/15">
              <th className="py-3 pr-4 font-semibold" style={{ color: GOLD }}>
                Rule
              </th>
              <th className="py-3 pr-4 font-semibold" style={{ color: GOLD }}>
                Total
              </th>
              <th className="py-3 pr-4 font-semibold" style={{ color: GOLD }}>
                Success
              </th>
              <th className="py-3 pr-4 font-semibold" style={{ color: GOLD }}>
                Failure
              </th>
              <th className="py-3 font-semibold" style={{ color: GOLD }}>
                Success rate
              </th>
            </tr>
          </thead>
          <tbody className="text-white/85">
            {withRate.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-white/45">
                  No learning data yet. Outcomes are recorded as hosts approve, reject, or act on Autopilot.
                </td>
              </tr>
            ) : (
              withRate.map((r) => (
                <tr key={r.ruleName} className="border-b border-white/[0.06]">
                  <td className="py-3 pr-4 font-mono text-xs text-white/90">{r.ruleName}</td>
                  <td className="py-3 pr-4 tabular-nums">{r.total}</td>
                  <td className="py-3 pr-4 tabular-nums text-emerald-400/90">{r.successCount}</td>
                  <td className="py-3 pr-4 tabular-nums text-rose-400/90">{r.failureCount}</td>
                  <td className="py-3 tabular-nums text-white/80">
                    {r.successRatePct === null ? "—" : `${r.successRatePct}%`}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
