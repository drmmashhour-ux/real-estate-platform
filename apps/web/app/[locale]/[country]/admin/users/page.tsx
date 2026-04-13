import Link from "next/link";
import { AccountStatus, PlatformRole } from "@prisma/client";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts, getAdminUsers } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Sp = Record<string, string | string[] | undefined>;

function pick(sp: Sp, key: string): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v.trim() || undefined;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || undefined;
  return undefined;
}

export default async function AdminUsersControlPage({ searchParams }: { searchParams: Promise<Sp> }) {
  await requireAdminControlUserId();
  const sp = await searchParams;
  const search = pick(sp, "q");
  const role = pick(sp, "role") as PlatformRole | undefined;
  const accountStatus = pick(sp, "account") as AccountStatus | undefined;
  const verified = pick(sp, "verified") as "yes" | "no" | undefined;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [rows, metrics, riskAlerts] = await Promise.all([
    getAdminUsers({ search, role, accountStatus, verified }),
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { role: "BROKER" } }),
      prisma.user.count({ where: { role: "HOST" } }),
    ]).then(([total, newThisWeek, brokers, hosts]) => ({ total, newThisWeek, brokers, hosts })),
    getAdminRiskAlerts(),
  ]);

  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-zinc-500">Accounts, roles, verification, and engagement signals.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Total users</p>
            <p className="mt-1 text-2xl font-bold text-white">{metrics.total.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">New (7d)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{metrics.newThisWeek.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Brokers</p>
            <p className="mt-1 text-2xl font-bold text-white">{metrics.brokers.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Hosts</p>
            <p className="mt-1 text-2xl font-bold text-white">{metrics.hosts.toLocaleString()}</p>
          </div>
        </div>

        <form className="flex flex-wrap gap-3 rounded-2xl border border-zinc-800 bg-[#111] p-4" method="get">
          <input
            name="q"
            defaultValue={search}
            placeholder="Email, name, code…"
            className="min-w-[200px] flex-1 rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
          />
          <select name="role" defaultValue={role ?? ""} className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white">
            <option value="">All roles</option>
            {Object.values(PlatformRole).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select name="account" defaultValue={accountStatus ?? ""} className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white">
            <option value="">All account states</option>
            {Object.values(AccountStatus).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select name="verified" defaultValue={verified ?? ""} className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white">
            <option value="">Email verification</option>
            <option value="yes">Verified</option>
            <option value="no">Unverified</option>
          </select>
          <button type="submit" className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-white">
            Search
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-black/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Listings</th>
                  <th className="px-4 py-3">Email ✓</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-800/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{u.name ?? "—"}</p>
                      <p className="text-xs text-zinc-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{u.role}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{u.accountStatus}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{u.createdAt.toISOString().slice(0, 10)}</td>
                    <td className="px-4 py-3 text-zinc-300">{u.bookingCount}</td>
                    <td className="px-4 py-3 text-zinc-300">{u.listingCount}</td>
                    <td className="px-4 py-3 text-xs">{u.emailVerified ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-zinc-600">
          Suspend / role changes: use{" "}
          <Link href="/admin/live-debug" className="text-zinc-400 underline">
            live debug
          </Link>{" "}
          or internal CRM tools — wire dedicated actions when ready.
        </p>
      </div>
    </LecipmControlShell>
  );
}
