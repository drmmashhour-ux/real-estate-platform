import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminAuditLog } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function AdminAuditReportPage() {
  await requireAdminControlUserId();
  const rows = await getAdminAuditLog(80);

  return (
    <LecipmControlShell>
      <div className="space-y-8">
        <div>
          <Link href="/admin/reports" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Reports
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-white">Audit log</h1>
          <p className="mt-1 text-sm text-zinc-500">
            BNHub engine decisions (extend with dedicated admin_audit when you need actor-level accountability).
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-black/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-800/80">
                    <td className="px-4 py-3 text-xs text-zinc-500">{r.at.toISOString().slice(0, 19)}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.actorLabel}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{r.action}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{r.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LecipmControlShell>
  );
}
