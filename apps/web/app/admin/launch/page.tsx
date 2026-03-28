import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { LaunchDashboard } from "@/components/admin/launch/LaunchDashboard";

export const dynamic = "force-dynamic";

export default async function AdminLaunchTrackingPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">Launch</p>
      <h1 className="mt-2 text-3xl font-semibold">Launch tracking</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Simple daily counters for outreach, content, and conversion during the first launch phase. Log numbers as you go;
        the report compares recent days to spot momentum and gaps.
      </p>
      <Link href="/admin/growth-engine" className="mt-3 inline-block text-sm text-emerald-400 hover:text-emerald-300">
        ← Growth engine
      </Link>

      <div className="mt-8">
        <LaunchDashboard />
      </div>
    </main>
  );
}
