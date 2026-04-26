import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

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
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Rule performance</h1>
        <p className="mt-1 text-sm text-white/50">
          Aggregated outcomes from learning signals (admin only). Counts are real database totals.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm text-white/80">
          <thead className="border-b border-white/10 bg-[#141414] text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold normal-case tracking-normal" style={{ color: GOLD }}>
                ruleName
              </th>
              <th className="px-4 py-3 font-semibold normal-case tracking-normal" style={{ color: GOLD }}>
                total
              </th>
              <th className="px-4 py-3 font-semibold normal-case tracking-normal" style={{ color: GOLD }}>
                successCount
              </th>
              <th className="px-4 py-3 font-semibold normal-case tracking-normal" style={{ color: GOLD }}>
                failureCount
              </th>
              <th className="px-4 py-3 font-semibold normal-case tracking-normal" style={{ color: GOLD }}>
                successRate
              </th>
            </tr>
          </thead>
          <tbody>
            {withRate.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/45">
                  No rows in <span className="font-mono text-white/55">ai_rule_performance</span> yet.
                </td>
              </tr>
            ) : (
              withRate.map((r) => (
                <tr key={r.ruleName} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-xs text-white/90">{r.ruleName}</td>
                  <td className="px-4 py-3 tabular-nums">{r.total}</td>
                  <td className="px-4 py-3 tabular-nums">{r.successCount}</td>
                  <td className="px-4 py-3 tabular-nums">{r.failureCount}</td>
                  <td className="px-4 py-3 tabular-nums text-white/85">
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
