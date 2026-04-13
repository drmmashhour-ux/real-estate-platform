import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { AdminDemoGenerateClient } from "./AdminDemoGenerateClient";
import { AdminDemoResetClient } from "./AdminDemoResetClient";
import { AdminDemoAnalyticsClient } from "./AdminDemoAnalyticsClient";

export const metadata = { title: "Staging demo tools" };

export default async function AdminDemoPage() {
  const guestId = await getGuestId();
  const user = guestId
    ? await prisma.user.findUnique({ where: { id: guestId }, select: { role: true } })
    : null;
  if (user?.role !== "ADMIN") {
    redirect("/admin");
  }

  return (
    <HubLayout title="Staging demo" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Demo & staging</h1>
          <p className="mt-2 text-sm text-slate-400">
            Use a separate Vercel project + Supabase/Neon database for staging. Never point staging at the production{" "}
            <code className="rounded bg-white/10 px-1">DATABASE_URL</code>. See{" "}
            <code className="rounded bg-white/10 px-1">docs/STAGING_ENVIRONMENT.md</code> in the repository.
          </p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white">Generate tester account</h2>
          <p className="mt-2 text-xs text-slate-400">
            Creates a verified user with a random password (shown once). For staging UAT only.
          </p>
          <div className="mt-4">
            <AdminDemoGenerateClient />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white">Reset demo data</h2>
          <p className="mt-2 text-xs text-slate-400">
            Truncates public tables, restores admin + demo users, then runs the main seed. Only when{" "}
            <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_ENV=staging</code>.
          </p>
          <div className="mt-4">
            <AdminDemoResetClient />
          </div>
          <p className="mt-4 text-xs text-slate-500">CLI (same operation):</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-slate-300">
            {`cd apps/web
NEXT_PUBLIC_ENV=staging npm run demo:reset`}
          </pre>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white">Demo analytics (staging)</h2>
          <p className="mt-2 text-xs text-slate-400">Aggregated from the DemoEvent table — login, page views, blocked actions, etc.</p>
          <div className="mt-4">
            <AdminDemoAnalyticsClient />
          </div>
        </section>
      </div>
    </HubLayout>
  );
}
