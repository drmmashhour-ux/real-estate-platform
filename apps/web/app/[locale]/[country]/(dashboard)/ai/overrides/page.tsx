import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

const GOLD = "#D4AF37";

export default async function AiOverridesPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/ai/overrides");
  if (!(await isPlatformAdmin(userId))) redirect("/ai");

  const rows = await prisma.managerAiOverrideEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Override log</h1>
        <p className="mt-1 text-sm text-white/50">Human interventions: kill switch, pause/resume, manual notes.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm text-white/80">
          <thead className="border-b border-white/10 bg-[#141414] text-xs uppercase tracking-wider text-white/45">
            <tr>
              <th className="px-4 py-3" style={{ color: GOLD }}>
                Time
              </th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-white/40">
                  No overrides yet.
                </td>
              </tr>
            ) : null}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-white/45">
                  {r.createdAt.toISOString()}
                </td>
                <td className="px-4 py-3 font-medium text-white">{r.scope}</td>
                <td className="px-4 py-3 font-mono text-xs text-white/50">{r.actorUserId.slice(0, 8)}…</td>
                <td className="max-w-md px-4 py-3 text-white/60">{r.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
