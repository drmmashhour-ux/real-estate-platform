"use client";

import * as React from "react";
import Link from "next/link";

import type { GrowthPolicyAction, GrowthPolicyActionBundle } from "@/modules/growth/policy/growth-policy-actions.types";
import {
  buildGrowthPolicyBrokerTeamHref,
  buildGrowthPolicyDashboardHref,
  growthPolicyReviewHashOverride,
} from "@/modules/growth/policy/growth-policy-navigation";
import { logGrowthPolicyActionClick } from "@/modules/growth/policy/growth-policy-actions-monitoring.service";
import type { GrowthPolicyHistoryHint } from "@/modules/growth/policy/growth-policy-history.types";
import type { GrowthPolicyResult, GrowthPolicySeverity } from "@/modules/growth/policy/growth-policy.types";

export type GrowthPolicyPanelProps = {
  locale: string;
  country: string;
  /** FEATURE_GROWTH_POLICY_ACTIONS_V1 — API includes `actionBundle`. */
  actionsBridgeEnabled?: boolean;
  /** FEATURE_GROWTH_POLICY_ACTIONS_PANEL_V1 — top action + links + per-row guidance. */
  actionsPanelUiEnabled?: boolean;
  /** FEATURE_GROWTH_POLICY_HISTORY_V1 — API records history + returns `historyHints`. */
  historyLayerEnabled?: boolean;
  /** Link to `#growth-mc-policy-history` when history panel flag is on. */
  historyPanelEnabled?: boolean;
};

function severityMeta(s: GrowthPolicySeverity): { emoji: string; bar: string; pill: string } {
  if (s === "critical")
    return {
      emoji: "🔴",
      bar: "border-red-500/50 bg-red-950/40 text-red-50",
      pill: "bg-red-500/25 text-red-100",
    };
  if (s === "warning")
    return {
      emoji: "🟡",
      bar: "border-amber-500/45 bg-amber-950/35 text-amber-50",
      pill: "bg-amber-500/20 text-amber-100",
    };
  return {
    emoji: "🔵",
    bar: "border-sky-500/35 bg-sky-950/25 text-sky-50",
    pill: "bg-sky-500/20 text-sky-100",
  };
}

function sortPolicies(p: GrowthPolicyResult[]): GrowthPolicyResult[] {
  const order: Record<GrowthPolicySeverity, number> = { critical: 0, warning: 1, info: 2 };
  return [...p].sort((a, b) => order[a.severity] - order[b.severity] || a.id.localeCompare(b.id));
}

function rowNavigation(
  locale: string,
  country: string,
  domain: GrowthPolicyResult["domain"],
  policyId: string,
  queryMerge?: Record<string, string>,
): { openHref: string; reviewHref: string | null } {
  const openHref = buildGrowthPolicyDashboardHref({
    locale,
    country,
    domain,
    policyId,
    queryMerge,
  });
  if (domain === "broker") {
    return {
      openHref,
      reviewHref: buildGrowthPolicyBrokerTeamHref({ locale, country, policyId }),
    };
  }
  const reviewHash = growthPolicyReviewHashOverride(domain);
  if (reviewHash) {
    return {
      openHref,
      reviewHref: buildGrowthPolicyDashboardHref({
        locale,
        country,
        domain,
        policyId,
        queryMerge,
        hashOverride: reviewHash,
      }),
    };
  }
  return { openHref, reviewHref: null };
}

function policyRowLinksFromAction(
  locale: string,
  country: string,
  action: GrowthPolicyAction,
): { openHref: string; reviewHref: string | null } {
  const q = action.queryParams;
  return rowNavigation(locale, country, action.domain, action.policyId, q);
}

function PolicyRows({
  items,
  locale,
  country,
  guidanceByDomain,
  showLinks,
}: {
  items: GrowthPolicyResult[];
  locale: string;
  country: string;
  guidanceByDomain?: Record<string, string>;
  showLinks?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 space-y-2">
      {items.map((p) => {
        const m = severityMeta(p.severity);
        const whatToDo = guidanceByDomain?.[p.domain];
        const { openHref, reviewHref } = rowNavigation(locale, country, p.domain, p.id);
        return (
          <li key={p.id} className={`rounded-lg border px-3 py-2.5 text-sm ${m.bar}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base leading-none">{m.emoji}</span>
              <span className="font-semibold">{p.title}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${m.pill}`}
              >
                {p.severity}
              </span>
              <span className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white/70">
                {p.domain}
              </span>
            </div>
            <p className="mt-1 text-[12px] opacity-95">{p.description}</p>
            {whatToDo ? (
              <p className="mt-1 text-[11px] text-emerald-100/90">
                <span className="font-semibold text-emerald-200/90">What to do:</span> {whatToDo}
              </p>
            ) : null}
            <p className="mt-1 text-[11px] text-amber-100/80">
              <span className="font-semibold text-amber-200/90">→</span> {p.recommendation}
            </p>
            {showLinks ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href={openHref}
                  onClick={() => {
                    try {
                      logGrowthPolicyActionClick({
                        policyId: p.id,
                        domain: p.domain,
                        surface: "open",
                      });
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="rounded border border-white/20 bg-black/35 px-2 py-1 text-[10px] font-semibold text-white hover:bg-white/10"
                >
                  Open
                </Link>
                {reviewHref ? (
                  <Link
                    href={reviewHref}
                    onClick={() => {
                      try {
                        logGrowthPolicyActionClick({
                          policyId: p.id,
                          domain: p.domain,
                          surface: "review",
                        });
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="rounded border border-white/15 bg-black/25 px-2 py-1 text-[10px] text-white/90 hover:bg-white/10"
                  >
                    Review
                  </Link>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function TopActionBlock({
  action,
  locale,
  country,
}: {
  action: GrowthPolicyAction;
  locale: string;
  country: string;
}) {
  const { openHref, reviewHref } = policyRowLinksFromAction(locale, country, action);
  return (
    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/90">Top next step</p>
      <p className="mt-1 text-sm font-semibold text-amber-50">{action.resolutionLabel}</p>
      <p className="mt-0.5 text-[11px] text-amber-100/85">{action.title}</p>
      <p className="mt-1 text-[10px] leading-snug text-amber-100/70">{action.rationale}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={openHref}
          onClick={() => {
            try {
              logGrowthPolicyActionClick({
                policyId: action.policyId,
                domain: action.domain,
                surface: "top-open",
              });
            } catch {
              /* ignore */
            }
          }}
          className="rounded border border-amber-400/35 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-amber-50 hover:bg-amber-950/40"
        >
          Open
        </Link>
        {reviewHref ? (
          <Link
            href={reviewHref}
            onClick={() => {
              try {
                logGrowthPolicyActionClick({
                  policyId: action.policyId,
                  domain: action.domain,
                  surface: "top-review",
                });
              } catch {
                /* ignore */
              }
            }}
            className="rounded border border-amber-400/25 bg-black/30 px-2.5 py-1 text-[10px] text-amber-100/90 hover:bg-amber-950/35"
          >
            Review
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function NextActionsList({
  actions,
  topId,
  locale,
  country,
}: {
  actions: GrowthPolicyAction[];
  topId?: string;
  locale: string;
  country: string;
}) {
  const rest = topId ? actions.filter((a) => a.id !== topId) : actions;
  if (rest.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {rest.map((a) => {
        const { openHref, reviewHref } = policyRowLinksFromAction(locale, country, a);
        return (
          <li
            key={a.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-1.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-zinc-200">{a.resolutionLabel}</p>
              <p className="text-[10px] text-zinc-500">{a.domain}</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Link
                href={openHref}
                onClick={() => {
                  try {
                    logGrowthPolicyActionClick({
                      policyId: a.policyId,
                      domain: a.domain,
                      surface: "list-open",
                    });
                  } catch {
                    /* ignore */
                  }
                }}
                className="rounded border border-zinc-600 px-1.5 py-0.5 text-[9px] text-zinc-300 hover:bg-zinc-800"
              >
                Open
              </Link>
              {reviewHref ? (
                <Link
                  href={reviewHref}
                  onClick={() => {
                    try {
                      logGrowthPolicyActionClick({
                        policyId: a.policyId,
                        domain: a.domain,
                        surface: "list-review",
                      });
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-400 hover:bg-zinc-800"
                >
                  Review
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function guidanceFromBundle(bundle: GrowthPolicyActionBundle): Record<string, string> {
  const map: Record<string, string> = {};
  for (const a of bundle.actions) {
    const line = a.notes[0];
    if (line && !map[a.domain]) map[a.domain] = line;
  }
  return map;
}

export function GrowthPolicyPanel({
  locale,
  country,
  actionsBridgeEnabled = false,
  actionsPanelUiEnabled = false,
}: GrowthPolicyPanelProps) {
  const [policies, setPolicies] = React.useState<GrowthPolicyResult[]>([]);
  const [bundle, setBundle] = React.useState<GrowthPolicyActionBundle | null>(null);
  const [note, setNote] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const showActionUi = actionsBridgeEnabled && actionsPanelUiEnabled;

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/policy", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as {
          policies?: GrowthPolicyResult[];
          note?: string;
          actionBundle?: GrowthPolicyActionBundle;
          error?: string;
        };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        setPolicies(sortPolicies(j.policies ?? []));
        setNote(j.note ?? null);
        setBundle(j.actionBundle ?? null);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [historyLayerEnabled]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-500">
        Loading growth policies…
      </div>
    );
  }
  if (err) {
    return (
      <div className="rounded-xl border border-red-900/45 bg-red-950/25 p-4 text-sm text-red-200">
        Growth policy: {err}
      </div>
    );
  }

  const critical = policies.filter((p) => p.severity === "critical");
  const warnings = policies.filter((p) => p.severity === "warning");
  const infos = policies.filter((p) => p.severity === "info");

  const guidanceByDomain =
    showActionUi && bundle ? guidanceFromBundle(bundle) : undefined;

  return (
    <section
      className="rounded-xl border border-amber-900/40 bg-black/55 p-4 shadow-[0_0_0_1px_rgba(212,175,55,0.1)]"
      data-growth-policy-v1
      data-growth-policy-actions-panel={showActionUi ? "1" : "0"}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold tracking-tight text-amber-100">Growth policy (V1)</p>
          <p className="mt-0.5 max-w-xl text-[11px] text-zinc-500">
            {note ?? "Advisory evaluation — does not block execution, ads, CRO, Stripe, or bookings."}
          </p>
          <p className="mt-1 max-w-xl text-[10px] leading-snug text-zinc-600">
            Live findings are authoritative. Action links navigate only (no execution). History, reviews, and trends are conservative
            snapshots — no causal attribution and no auto-resolve.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500">
          <span>
            🔴 Critical <strong className="text-zinc-300">{critical.length}</strong>
          </span>
          <span>
            🟡 Warnings <strong className="text-zinc-300">{warnings.length}</strong>
          </span>
          <span>
            🔵 Info <strong className="text-zinc-300">{infos.length}</strong>
          </span>
        </div>
      </div>

      {showActionUi && bundle?.topAction ? (
        <TopActionBlock action={bundle.topAction} locale={locale} country={country} />
      ) : null}

      {showActionUi && bundle && bundle.actions.length > 0 ? (
        <div className="mt-3 border-t border-zinc-800/80 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Resolution queue ({bundle.actions.length})
          </p>
          <NextActionsList
            actions={bundle.actions}
            topId={bundle.topAction?.id}
            locale={locale}
            country={country}
          />
        </div>
      ) : null}

      {policies.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No policy findings for current signals.</p>
      ) : (
        <div className="mt-4 space-y-5">
          {critical.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-red-300/90">
                🔴 Critical
              </p>
              <PolicyRows
                items={critical}
                locale={locale}
                country={country}
                guidanceByDomain={guidanceByDomain}
                showLinks={showActionUi}
              />
            </div>
          ) : null}
          {warnings.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-200/90">
                🟡 Warnings
              </p>
              <PolicyRows
                items={warnings}
                locale={locale}
                country={country}
                guidanceByDomain={guidanceByDomain}
                showLinks={showActionUi}
              />
            </div>
          ) : null}
          {infos.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-200/90">🔵 Info</p>
              <PolicyRows
                items={infos}
                locale={locale}
                country={country}
                guidanceByDomain={guidanceByDomain}
                showLinks={showActionUi}
                hintsByPolicyId={historyHints}
                historyAnchorHref={historyAnchorHref}
              />
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
