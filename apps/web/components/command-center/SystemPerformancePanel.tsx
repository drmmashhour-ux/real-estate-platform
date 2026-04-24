import type { SystemPerformancePanelView } from "@/modules/command-center/command-center.types";

import { cc } from "./cc-tokens";
import { CcStatusBadge } from "./CcStatusBadge";

export function SystemPerformancePanel(props: { data: NonNullable<SystemPerformancePanelView> }) {
  const { data } = props;
  return (
    <section aria-labelledby="sys-perf" className="mb-10">
      <h2 id="sys-perf" className={`${cc.sectionTitle} mb-1`}>
        {data.title}
      </h2>
      <p className="mb-4 max-w-3xl text-sm text-neutral-500">{data.headline}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cc.card}>
          <h3 className="text-sm font-semibold text-[#f4efe4]">KPIs</h3>
          <dl className="mt-4 space-y-3 text-sm">
            {data.rows.map((r) => (
              <div key={r.label} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b1b1b]/80 pb-2 last:border-0">
                <div>
                  <dt className="text-neutral-500">{r.label}</dt>
                  {r.hint ? <p className="text-[11px] text-neutral-600">{r.hint}</p> : null}
                </div>
                <dd className="flex items-center gap-2">
                  <span className="text-neutral-100">{r.value}</span>
                  <CcStatusBadge lane={r.lane} />
                </dd>
              </div>
            ))}
          </dl>
          {data.learningQueue > 0 ? (
            <p className="mt-3 text-xs text-amber-500/90">
              Learning queue: {data.learningQueue} proposed calibration review{data.learningQueue > 1 ? "s" : ""} (safe mode —
              not auto-applied).
            </p>
          ) : null}
        </div>
        <div className={cc.cardMuted}>
          <h3 className="text-sm font-semibold text-[#f4efe4]">Wins & misses (signal)</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500/90">Biggest wins</p>
              <ul className="mt-2 space-y-2 text-xs text-neutral-400">
                {data.wins.length === 0 ?
                  <li className="text-neutral-600">No labeled wins in-window yet.</li>
                : data.wins.map((w) => (
                    <li key={w.id}>
                      <span className="text-neutral-200">{w.title}</span> — {w.detail.slice(0, 100)}
                      {w.detail.length > 100 ? "…" : ""}
                    </li>
                  ))
                }
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-400/90">Biggest misses</p>
              <ul className="mt-2 space-y-2 text-xs text-neutral-400">
                {data.misses.length === 0 ?
                  <li className="text-neutral-600">No labeled misses in-window.</li>
                : data.misses.map((m) => (
                    <li key={m.id}>
                      <span className="text-neutral-200">{m.title}</span> — {m.detail.slice(0, 100)}
                      {m.detail.length > 100 ? "…" : ""}
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-neutral-600">
            Series (daily accuracy, recent):{" "}
            {data.series
              .map((p) => (p.accuracy == null ? "—" : `${(p.accuracy * 100).toFixed(0)}%`))
              .join(" → ")}
          </p>
        </div>
      </div>
    </section>
  );
}
