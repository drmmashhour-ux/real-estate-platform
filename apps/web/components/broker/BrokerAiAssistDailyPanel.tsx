"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import type { BrokerAiDailyAssist } from "@/modules/broker/ai-assist/broker-ai-assist.types";

export function BrokerAiAssistDailyPanel({ accent = "#38bdf8" }: { accent?: string }) {
  const params = useParams<{ locale?: string; country?: string }>();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const country = typeof params?.country === "string" ? params.country : "ca";

  const [loading, setLoading] = React.useState(true);
  const [daily, setDaily] = React.useState<BrokerAiDailyAssist | null>(null);
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch("/api/broker/ai-assist", { credentials: "same-origin" })
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setHidden(true);
          return;
        }
        const data = (await res.json()) as { daily?: BrokerAiDailyAssist };
        if (!cancelled) setDaily(data.daily ?? null);
      })
      .catch(() => {
        if (!cancelled) setHidden(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (hidden || (!loading && !daily)) return null;

  const leadHref = (id: string) =>
    `/${locale}/${country}/dashboard/leads/${encodeURIComponent(id)}`;

  return (
    <section className="rounded-2xl border border-sky-500/20 bg-sky-950/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400/90">Daily assist</p>
          <h3 className="mt-1 text-sm font-semibold text-white">Focus for today</h3>
          <p className="mt-1 max-w-2xl text-[11px] text-slate-500">
            Complements “Top 3 to close” — pattern-based, not predictions. You choose every action.
          </p>
        </div>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-slate-400">Suggested</span>
      </div>
      {loading ? (
        <p className="mt-3 text-xs text-slate-500">Loading…</p>
      ) : daily ? (
        <>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            {daily.lines.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: accent }} className="shrink-0">
                  •
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-400">
            {daily.followUpNow.length > 0 ? (
              <span>
                Follow-up now:{" "}
                {daily.followUpNow.slice(0, 5).map((r, i) => (
                  <React.Fragment key={r.leadId}>
                    {i > 0 ? " · " : ""}
                    <a href={leadHref(r.leadId)} className="text-sky-300 underline hover:text-sky-200">
                      {r.name}
                    </a>
                  </React.Fragment>
                ))}
              </span>
            ) : null}
            {daily.opportunities.length > 0 ? (
              <span>
                Opportunities:{" "}
                {daily.opportunities.slice(0, 5).map((r, i) => (
                  <React.Fragment key={r.leadId}>
                    {i > 0 ? " · " : ""}
                    <a href={leadHref(r.leadId)} className="text-emerald-300/90 underline hover:text-emerald-200">
                      {r.name}
                    </a>
                  </React.Fragment>
                ))}
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
