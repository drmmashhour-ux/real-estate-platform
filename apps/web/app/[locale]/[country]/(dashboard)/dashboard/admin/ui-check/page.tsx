import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { isLaunchReady } from "@/lib/launch/readiness";
import { uiChecklist } from "@/lib/ui/checklist";
import { runUIAudit } from "@/lib/ui/auditHeuristics";

export const dynamic = "force-dynamic";

export default async function AdminUICheckPage({
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

  const [audit, gate] = await Promise.all([runUIAudit().catch((e) => {
    console.error("[ui-check page] audit", e);
    return { score: 0, passed: [] as string[], failed: [] as string[] };
  }), isLaunchReady()]);

  const statusFor = (label: string) => (audit.passed.includes(label) ? "pass" : "fail") as "pass" | "fail";

  return (
    <div className="min-h-screen space-y-8 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Order 52.1</p>
        <h1 className="mt-2 text-2xl font-bold">UI quality audit</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Heuristic checks from the shared checklist — not a visual regression suite. For production, set{" "}
          <code className="rounded bg-zinc-800 px-1 font-mono text-amber-100/90">UI_AUDIT_PERF_PASS=1</code> when you have
          manually verified LCP under target.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <Link href={base} className="text-[#D4AF37] hover:underline">
            ← Admin home
          </Link>
          <Link href={`${base}/launch-control`} className="text-zinc-500 hover:text-zinc-200">
            Launch control
          </Link>
          <Link href={`${base}/launch-readiness`} className="text-zinc-500 hover:text-zinc-200">
            Launch readiness
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-zinc-400">Score</h2>
            <p className="mt-1 text-3xl font-bold tabular-nums text-white">{audit.score}/100</p>
            <p className="mt-1 text-xs text-zinc-500">Launch gate requires ≥ 80, plus early users and acquisition (see below).</p>
          </div>
          <div className="text-right text-xs text-zinc-500">
            <p>Launch readiness: {gate.ready ? <span className="text-emerald-400">ready</span> : <span className="text-amber-300">blocked</span>}</p>
            {!gate.ready && gate.reasons.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-left text-zinc-400">
                {gate.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 tabular-nums">Early users: {gate.details.earlyUserCount}</p>
            <p className="tabular-nums">Non-visitor signups: {gate.details.nonVisitorSignups}</p>
          </div>
        </div>
        <div
          className="mt-4 h-3 w-full overflow-hidden rounded-full bg-zinc-800"
          role="progressbar"
          aria-valuenow={audit.score}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[#D4AF37] transition-all"
            style={{ width: `${Math.min(100, audit.score)}%` }}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Checklist</h2>
        <ul className="mt-3 divide-y divide-zinc-800 rounded-2xl border border-zinc-800">
          {uiChecklist.map((item) => {
            const st = statusFor(item);
            return (
              <li key={item} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-zinc-200">{item}</span>
                <span
                  className={
                    st === "pass"
                      ? "rounded-md bg-emerald-950/50 px-2 py-0.5 text-xs font-medium text-emerald-300"
                      : "rounded-md bg-rose-950/40 px-2 py-0.5 text-xs font-medium text-rose-200"
                  }
                >
                  {st === "pass" ? "Pass" : "Fail"}
                </span>
              </li>
            );
          })}
        </ul>
        {audit.failed.length > 0 ? (
          <p className="mt-3 text-xs text-zinc-500">Failed: {audit.failed.join(" · ")}</p>
        ) : null}
      </section>
    </div>
  );
}
