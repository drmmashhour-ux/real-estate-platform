import Link from "next/link";
import { redirect } from "next/navigation";

import { DemoModeAdminClient } from "@/components/admin/DemoModeAdminClient";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { flags } from "@/lib/flags";

export const dynamic = "force-dynamic";

export default async function AdminDemoModePage({
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

  const prod = process.env.NODE_ENV === "production";
  const serverDemoOn = flags.DEMO_MODE && (!prod || flags.DEMO_MODE_PROD);
  const showCookieToggle = !prod && flags.DEMO_MODE_CLIENT_COOKIE;

  return (
    <div className="min-h-screen space-y-8 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Order 61</p>
        <h1 className="mt-2 text-2xl font-bold">Demo mode</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Demo responses are <strong>read-only</strong> and use static datasets in <code className="text-amber-100/90">lib/demo/data.ts</code>. They never insert into real marketplace tables, except
          a simulated <code className="text-amber-100/90">POST /api/bookings</code> path that returns 201 for{" "}
          <code className="text-amber-100/90">demo-*</code> listing IDs <strong>without</strong> persisting a row.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href={base} className="text-[#D4AF37] hover:underline">
            ← Admin home
          </Link>
          <Link href={`${base}/launch-readiness`} className="text-zinc-500 hover:text-zinc-200">
            Launch readiness
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Server status</h2>
        <ul className="list-inside list-disc text-sm text-zinc-400 space-y-1">
          <li>
            <code className="text-amber-100/80">FEATURE_DEMO_MODE</code> = {flags.DEMO_MODE ? "on" : "off"}
          </li>
          <li>
            <code className="text-amber-100/80">FEATURE_DEMO_MODE_PROD</code> = {flags.DEMO_MODE_PROD ? "on" : "off"}{" "}
            (required with demo in production)
          </li>
          <li>
            <code className="text-amber-100/80">FEATURE_DEMO_MODE_CLIENT</code> ={" "}
            {flags.DEMO_MODE_CLIENT_COOKIE ? "on" : "off"} (dev/staging: cookie + admin toggle)
          </li>
          <li>Effective read-only demo from env: {serverDemoOn ? "yes" : "no"}</li>
        </ul>
        {prod && !serverDemoOn ? (
          <p className="text-sm text-amber-200/80">
            Production: demo is off until both <code className="rounded bg-zinc-800 px-1">FEATURE_DEMO_MODE=1</code> and{" "}
            <code className="rounded bg-zinc-800 px-1">FEATURE_DEMO_MODE_PROD=1</code> are set for a dedicated demo host.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Local preview (cookie)</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Sets a short-lived <code className="rounded bg-zinc-800 px-1">lecipm_demo=1</code> cookie and reloads. Optional query{" "}
          <code className="rounded bg-zinc-800 px-1">?demo=high_demand</code> / <code className="rounded bg-zinc-800 px-1">low_conversion</code> /{" "}
          <code className="rounded bg-zinc-800 px-1">growth_surge</code> to shape datasets.
        </p>
        <div className="mt-4">
          <DemoModeAdminClient showClientCookieToggle={showCookieToggle} />
        </div>
      </section>
    </div>
  );
}
