import { redirect } from "next/navigation";
import Link from "next/link";

import { UILaunchReadinessBadge } from "@/components/admin/UILaunchReadinessBadge";
import { LaunchControlClient } from "@/components/launch/LaunchControlClient";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { flags } from "@/lib/flags";
import { getLaunchStatus } from "@/lib/launch/controller";

export const dynamic = "force-dynamic";

export default async function LaunchControlPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}`;
  const adminBase = `${base}/dashboard/admin`;

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(`${adminBase}`);
  }

  const enabled = flags.AUTONOMOUS_AGENT;
  const s = enabled ? await getLaunchStatus() : null;

  const statusLabel = s?.status ?? "idle";
  const started = s?.startedAt?.toISOString() ?? "—";
  const day = s?.currentDay ?? 1;
  const canStart = enabled && s != null && s.status !== "running";
  const canStop = enabled && s?.status === "running";

  return (
    <div className="min-h-screen space-y-8 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Order 50</p>
        <h1 className="mt-2 text-2xl font-bold">One-click launch</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Start, monitor, and stop a platform-wide launch. No auto-spend, no price or campaign writes — only signals and
          your checklist state. Growth Brain uses priority-first ordering while running.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Link href={adminBase} className="text-[#D4AF37] hover:underline">
            ← Admin home
          </Link>
          <Link href={`${base}/dashboard/admin/launch`} className="text-zinc-400 hover:text-zinc-200">
            7-day launch checklist
          </Link>
          <Link href={`${adminBase}/launch-readiness`} className="text-zinc-400 hover:text-zinc-200">
            Launch readiness
          </Link>
          <Link href={`${base}/dashboard/admin/ui-check`} className="text-zinc-500 hover:text-zinc-200">
            UI check
          </Link>
          {enabled ? (
            <UILaunchReadinessBadge />
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5">
        <h2 className="text-sm font-medium text-zinc-500">State</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd className="mt-1 font-semibold capitalize text-zinc-100">{statusLabel}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Current day (1–7)</dt>
            <dd className="mt-1 font-semibold tabular-nums text-zinc-100">{day}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Started at (UTC)</dt>
            <dd className="mt-1 font-mono text-xs text-zinc-300 md:text-sm">{started}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <LaunchControlClient
            startHref="/api/launch/start"
            stopHref="/api/launch/stop"
            canStart={!!canStart}
            canStop={!!canStop}
            disabled={!enabled}
          />
        </div>
      </section>
    </div>
  );
}
