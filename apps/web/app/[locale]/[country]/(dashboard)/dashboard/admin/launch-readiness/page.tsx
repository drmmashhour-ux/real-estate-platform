import Link from "next/link";
import { redirect } from "next/navigation";

import { LaunchReadinessClient } from "@/components/admin/LaunchReadinessClient";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Launch Readiness",
};

export default async function LaunchReadinessPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/admin`;

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(base);
  }

  return (
    <div className="min-h-screen space-y-8 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Order 60</p>
        <h1 className="mt-2 text-2xl font-bold">Launch Readiness</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Automated system checks, weighted score, and a critical gate (DB integrity + booking path + EXCLUDE) used
          by <code className="rounded bg-zinc-800 px-1">startLaunch()</code>. Run before one-click launch.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Link href={base} className="text-[#D4AF37] hover:underline">
            ← Admin home
          </Link>
          <Link href={`${base}/ui-check`} className="text-zinc-500 hover:text-zinc-200">
            UI check
          </Link>
          <Link href={`${base}/launch-control`} className="text-zinc-500 hover:text-zinc-200">
            Launch control
          </Link>
          <Link href={`${base}/demo`} className="text-zinc-500 hover:text-zinc-200">
            Demo mode
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5 md:p-6">
        <LaunchReadinessClient initial={null} initialError={null} />
      </section>
    </div>
  );
}
