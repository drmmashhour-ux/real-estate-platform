import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const role = await getUserRole();
  if (!isHubAdminRole(role)) redirect("/admin");

  const rows = await prisma.userFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const rated = rows.filter((r) => r.rating != null);
  const avg =
    rated.length > 0 ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">User feedback</h1>
        <p className="mt-1 text-slate-400">
          Ratings and messages from the global Feedback widget and legacy product form (aggregated message text).
        </p>
        {avg != null ? (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            Average rating (all rows with a score): <strong>{avg.toFixed(2)}</strong> / 5 ·{" "}
            <span className="text-emerald-200/80">{rated.length} ratings</span>
          </p>
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const highlight = r.rating != null && r.rating >= 4;
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-white/5 ${highlight ? "bg-amber-500/[0.06]" : ""}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                      {r.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-amber-100">
                      {r.rating != null ? `${r.rating} / 5` : "—"}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-400" title={r.page ?? ""}>
                      {r.page ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-400">
                      {r.user ? r.user.email ?? r.user.id.slice(0, 8) : "Anonymous"}
                    </td>
                    <td className="max-w-xl px-4 py-3 text-slate-300">
                      <span className="line-clamp-4 whitespace-pre-wrap">{r.message ?? "—"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <p className="mt-6 text-center text-slate-500">No feedback yet.</p> : null}
      </div>
    </main>
  );
}
