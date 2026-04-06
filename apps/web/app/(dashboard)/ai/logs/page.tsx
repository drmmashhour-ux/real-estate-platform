import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AiLogsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/ai/logs");

  const admin = await isPlatformAdmin(userId);
  const runs = await prisma.managerAiAgentRun.findMany({
    where: admin ? {} : { userId },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      agentKey: true,
      decisionMode: true,
      status: true,
      confidence: true,
      createdAt: true,
      inputSummary: true,
      outputSummary: true,
      targetEntityType: true,
      targetEntityId: true,
    },
  });

  const actions = await prisma.managerAiActionLog.findMany({
    where: admin ? {} : { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      actionKey: true,
      status: true,
      createdAt: true,
      targetEntityType: true,
      targetEntityId: true,
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-2 text-lg font-semibold text-white">Agent runs</h1>
        <p className="mb-4 text-sm text-white/45">{admin ? "Platform-wide" : "Your account only"}</p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm text-white/80">
            <thead className="border-b border-white/10 text-xs uppercase text-white/40">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Agent</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Summary</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-mono text-xs text-white/50">{r.createdAt.toISOString()}</td>
                  <td className="px-3 py-2">{r.agentKey}</td>
                  <td className="px-3 py-2">{r.decisionMode}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="max-w-md truncate px-3 py-2 text-white/60">{r.outputSummary ?? r.inputSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Action audit</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[520px] text-left text-sm text-white/80">
            <thead className="border-b border-white/10 text-xs uppercase text-white/40">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-mono text-xs text-white/50">{a.createdAt.toISOString()}</td>
                  <td className="px-3 py-2">{a.actionKey}</td>
                  <td className="px-3 py-2 text-xs">
                    {a.targetEntityType}/{a.targetEntityId.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
