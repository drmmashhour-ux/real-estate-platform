import type { CityMarketGroup, MarketAction, MarketInsight } from "@/lib/ai/marketInsights";

type Variant = "light" | "dark";

type Props = {
  insights: MarketInsight[];
  actions: MarketAction[];
  /** When set, shows a second section grouped by city (richer UX). */
  cities?: CityMarketGroup[];
  variant?: Variant;
  className?: string;
};

const actionLabel: Record<MarketAction["type"], string> = {
  price_increase: "Price",
  increase_supply: "Supply",
  improve_listings: "Listing quality",
};

const priorityStyle = (isDark: boolean, p: MarketAction["priority"]) => {
  if (p === "high") {
    return isDark
      ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
      : "border-orange-300 bg-orange-50 text-orange-950";
  }
  if (p === "medium") {
    return isDark
      ? "border-amber-500/25 bg-amber-500/5 text-amber-100/95"
      : "border-amber-200 bg-amber-50 text-amber-950";
  }
  return isDark ? "border-zinc-700 bg-zinc-900/40 text-zinc-300" : "border-slate-200 bg-slate-50 text-slate-800";
};

const confidenceBadge = (isDark: boolean, c: MarketInsight["confidence"]) => {
  const base = isDark ? "text-[10px] uppercase tracking-wide" : "text-[10px] uppercase tracking-wide";
  const tone =
    c === "high"
      ? isDark
        ? "text-emerald-400/90"
        : "text-emerald-700"
      : c === "medium"
        ? isDark
          ? "text-amber-400/90"
          : "text-amber-800"
        : isDark
          ? "text-zinc-500"
          : "text-slate-500";
  return <span className={`${base} ${tone}`}>{c} confidence</span>;
};

/**
 * Renders structured market insight cards and action rows (priority, execution `type` for orchestrator).
 */
export function MarketInsights({ insights, actions, cities, variant = "light", className = "" }: Props) {
  const isDark = variant === "dark";
  if (insights.length === 0 && actions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-5 ${className}`} data-market-insights="1">
      {insights.length > 0 ? (
        <div>
          <h2
            className={
              isDark
                ? "text-lg font-semibold text-white"
                : "text-lg font-semibold text-slate-900"
            }
          >
            Market insights
          </h2>
          <ul className="mt-3 space-y-2">
            {insights.map((i) => (
              <li
                key={`${i.type}-${i.city}-${i.metric}`}
                className={
                  isDark
                    ? "rounded-xl border border-zinc-800 bg-black/30 px-3 py-2.5 text-sm text-zinc-200"
                    : "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm"
                }
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>{i.message}</span>
                  {confidenceBadge(isDark, i.confidence)}
                </div>
                <p
                  className={
                    isDark ? "mt-1 font-mono text-[11px] text-zinc-500" : "mt-1 font-mono text-[11px] text-slate-500"
                  }
                >
                  {i.metric}=
                  {i.metric === "views" ? i.value.toFixed(0) : i.value.toFixed(4)} · trend=
                  {i.contextTrend.toFixed(4)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {actions.length > 0 ? (
        <div>
          <h3
            className={
              isDark
                ? "text-sm font-semibold text-zinc-300"
                : "text-sm font-semibold text-slate-700"
            }
          >
            Recommended actions
          </h3>
          <ul className="mt-2 space-y-2">
            {actions.map((a) => (
              <li
                key={`${a.reason}-${a.city}-${a.type}`}
                className={`rounded-xl border px-3 py-2.5 text-sm ${priorityStyle(isDark, a.priority)}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="font-medium">{a.city}</span>
                    <span className={isDark ? "text-white/50" : "text-slate-600"}> · {actionLabel[a.type]}</span>
                    <span
                      className={
                        isDark
                          ? "ml-2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase"
                          : "ml-2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] uppercase"
                      }
                    >
                      {a.priority} priority
                    </span>
                  </span>
                  <code
                    className={
                      isDark ? "text-[10px] text-zinc-500" : "text-[10px] text-slate-500"
                    }
                  >
                    {a.type} · {a.reason}
                  </code>
                </div>
                <p className={isDark ? "mt-1 text-zinc-300" : "mt-1 text-slate-800"}>{a.suggestion}</p>
                {a.estimatedImpact != null ? (
                  <p
                    className={
                      isDark ? "mt-1 text-xs text-zinc-500" : "mt-1 text-xs text-slate-600"
                    }
                  >
                    {a.estimatedImpact.revenueIncreasePct != null ? (
                      <>Est. revenue upside ~{a.estimatedImpact.revenueIncreasePct}% (</>
                    ) : (
                      <>Impact confidence (</>
                    )}
                    {a.estimatedImpact.confidence})
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {cities != null && cities.length > 0 ? (
        <div>
          <h3
            className={
              isDark
                ? "text-sm font-semibold text-zinc-300"
                : "text-sm font-semibold text-slate-700"
            }
          >
            By city
          </h3>
          <ul className="mt-2 space-y-3">
            {cities.map((g) => (
              <li
                key={g.city}
                className={
                  isDark
                    ? "rounded-xl border border-zinc-800 bg-zinc-950/40 p-3"
                    : "rounded-xl border border-slate-200 bg-slate-50/80 p-3"
                }
              >
                <p
                  className={
                    isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-900"
                  }
                >
                  {g.city}
                </p>
                {g.insights.length > 0 ? (
                  <ul
                    className={
                      isDark
                        ? "mt-1 list-inside list-disc text-xs text-zinc-400"
                        : "mt-1 list-inside list-disc text-xs text-slate-600"
                    }
                  >
                    {g.insights.map((i) => (
                      <li key={i.type + i.metric}>{i.message}</li>
                    ))}
                  </ul>
                ) : null}
                {g.actions.length > 0 ? (
                  <ul
                    className={
                      isDark
                        ? "mt-1 space-y-1 text-xs text-amber-200/90"
                        : "mt-1 space-y-1 text-xs text-amber-900/90"
                    }
                  >
                    {g.actions.map((a) => (
                      <li key={a.type + a.reason}>
                        {a.suggestion} ({a.priority})
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
