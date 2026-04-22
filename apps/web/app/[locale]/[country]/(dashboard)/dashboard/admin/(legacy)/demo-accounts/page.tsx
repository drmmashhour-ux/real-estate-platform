import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DEMO_ACCOUNT_EMAILS } from "@/lib/demo/demo-account-constants";
import { isDemoQuickLoginAllowed } from "@/lib/demo/is-demo-quick-login-allowed";
import { DemoAccountLoginButton } from "./DemoAccountLoginButton";

export const dynamic = "force-dynamic";

function tenantRoleLabel(role: string): string {
  switch (role) {
    case "TENANT_OWNER":
      return "Owner";
    case "TENANT_ADMIN":
      return "Admin";
    case "BROKER":
      return "Broker";
    case "ASSISTANT":
      return "Assistant";
    case "VIEWER":
      return "Client";
    default:
      return role;
  }
}

export default async function DemoAccountsAdminPage() {
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent("/dashboard/admin/demo-accounts")}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const quickLogin = isDemoQuickLoginAllowed();

  const rows = await prisma.user.findMany({
    where: { email: { in: [...DEMO_ACCOUNT_EMAILS] } },
    include: {
      tenantMemberships: {
        where: { status: "ACTIVE" },
        include: { tenant: { select: { name: true } } },
        orderBy: { tenantId: "asc" },
      },
    },
  });

  const byEmail = new Map(rows.map((u) => [u.email.toLowerCase(), u]));
  const ordered = DEMO_ACCOUNT_EMAILS.map((e) => byEmail.get(e)).filter(Boolean) as typeof rows;

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">Demo accounts</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Canonical users from <code className="text-amber-200/90">npm run demo:full</code>. Use{" "}
          <span className="text-slate-200">Login</span> to switch sessions during a demo (only when staging or{" "}
          <code className="text-amber-200/90">DEMO_MODE</code> is enabled on the server).
        </p>
        {!quickLogin ? (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Quick login is off in this environment. Sign in with email and password from{" "}
            <code className="text-white">docs/demo/DEMO_ACCOUNTS.md</code>.
          </p>
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Tenant & role</th>
                <th className="px-4 py-3 font-medium">Login</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((u) => (
                <tr key={u.id} className="border-b border-white/[0.06] last:border-0">
                  <td className="px-4 py-3 text-slate-200">{u.name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{u.email}</td>
                  <td className="px-4 py-3 text-slate-400">{u.role}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {u.tenantMemberships.length === 0 ? (
                      "—"
                    ) : (
                      <ul className="list-inside list-disc space-y-1">
                        {u.tenantMemberships.map((m) => (
                          <li key={m.tenantId}>
                            <span className="text-slate-300">{m.tenant.name}</span> — {tenantRoleLabel(m.role)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DemoAccountLoginButton email={u.email} enabled={quickLogin} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
