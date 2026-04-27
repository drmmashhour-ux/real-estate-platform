import Link from "next/link";
import { redirect } from "next/navigation";

import { getProductActions, getProductInsights } from "@/lib/ai/productIntelligence";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

function priorityPill(p: "low" | "medium" | "high") {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (p === "high") return `${base} bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40`;
  if (p === "medium") return `${base} bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35`;
  return `${base} bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-600/50`;
}

function insightTypeBadge(t: "retention" | "feedback" | "revenue") {
  const m: Record<typeof t, string> = {
    retention: "text-sky-300",
    feedback: "text-violet-300",
    revenue: "text-emerald-300",
  };
  return <span className={`text-xs font-semibold uppercase ${m[t]}`}>{t}</span>;
}

export default async function ProductIntelligenceAdminPage({
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

  const [insights, actions] = await Promise.all([getProductInsights(), getProductActions()]);
  void trackEvent("product_insight_viewed", { insightCount: insights.length }, { userId: admin.userId });
  void trackEvent("operator_daily_flow_view", { order: "SYBNB-AI-122" }, { userId: admin.userId });

  return (
    <div className="min-h-screen space-y-10 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Order 57</p>
        <h1 className="mt-2 text-2xl font-bold">Product intelligence</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Retention, feedback, revenue, and event signals → suggestions only. No auto-messaging, no live product
          rewrites from this view.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          <span className="text-zinc-300">Daily habit:</span> use the <strong className="font-semibold text-zinc-200">Daily operator flow</strong> below
          first — then scan insights (2–3 minutes).
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href={base} className="text-[#D4AF37] hover:underline">
            ← Admin home
          </Link>
        </div>
      </div>

      <section
        className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/40 to-zinc-950/40 p-5 md:p-6"
        aria-labelledby="daily-operator-flow-heading"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/90">Order SYBNB-AI-122</p>
        <h2 id="daily-operator-flow-heading" className="mt-2 text-lg font-bold text-zinc-100">
          Daily operator flow
        </h2>
        <p className="mt-1 text-sm text-zinc-400">Make product intelligence part of your routine — one deliberate step at a time.</p>

        <ol className="mt-5 list-decimal space-y-2.5 ps-5 text-sm leading-relaxed text-zinc-200">
          <li>Open this dashboard.</li>
          <li>
            Read insights — about <span className="whitespace-nowrap text-zinc-100">2–3 minutes</span> max.
          </li>
          <li>
            Pick <strong className="text-zinc-100">one</strong> action only (see examples).
          </li>
          <li>
            Execute it <strong className="text-zinc-100">manually</strong> (no automation triggered from this page).
          </li>
          <li>Next day: observe what moved — one calm check, not a frenzy.</li>
        </ol>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-500">Example actions (pick one)</h3>
        <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm text-zinc-300">
          <li>Fix onboarding confusion (where users drop or get stuck)</li>
          <li>Message inactive users (thoughtful, personal outreach)</li>
          <li>Improve listings (quality, photos, or clarity in bulk)</li>
        </ul>

        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/95">Rule</p>
          <p className="mt-1.5 text-sm text-zinc-200">
            <strong className="text-amber-100/95">1 action per day max.</strong> No overreaction to a single bad number.
          </p>
        </div>

        <div className="mt-3 rounded-xl border border-sky-500/25 bg-sky-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-200/90">Success</p>
          <p className="mt-1.5 text-sm text-zinc-200">
            Steady improvement over time — <strong className="text-sky-100/90">no chaos</strong>, no constant strategy pivots.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Insights</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((ins, i) => (
            <div key={`${ins.type}-${i}`} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              {insightTypeBadge(ins.type)}
              <p className="mt-2 text-sm text-zinc-200">{ins.summary}</p>
              <p className="mt-2 font-mono text-lg tabular-nums text-[#D4AF37]">{ins.metric}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recommended actions</h2>
        <ul className="mt-3 divide-y divide-zinc-800 rounded-2xl border border-zinc-800">
          {actions.map((a) => (
            <li key={a.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={priorityPill(a.priority)}>{a.priority}</span>
                <span className="text-xs text-zinc-500">{a.area}</span>
              </div>
              <h3 className="mt-2 font-medium text-zinc-100">{a.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{a.description}</p>
              <p className="mt-2 text-sm text-zinc-300">
                <span className="text-zinc-500">Suggest: </span>
                {a.suggestedAction}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-zinc-600">
          Manual nudge: use <code className="font-mono">sendRetentionWeMissYouNudge(userId)</code> from ops (stub logs to
          console) — not invoked automatically.
        </p>
      </section>
    </div>
  );
}
