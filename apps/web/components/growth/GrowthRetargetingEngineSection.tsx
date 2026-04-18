import { generateRetargetingPlan } from "@/modules/ads/ads-retargeting-strategy.service";
import { listRetargetingAutopilotRecommendations } from "@/modules/growth/retargeting-autopilot-bridge";
import {
  getRetargetingPerformanceHealth,
  getTopMessagesBySegment,
  getWeakMessages,
  retargetingPerformanceReady,
  snapshotAll,
} from "@/modules/growth/retargeting-performance.service";
import { buildUnifiedSnapshot, loadPersistentCroRetargetingLearning } from "@/modules/growth/unified-learning.service";
import {
  croRetargetingDurabilityFlags,
  croRetargetingLearningFlags,
  negativeSignalQualityFlags,
} from "@/config/feature-flags";
import {
  getDurabilityHealth,
  getTopRetargetingMessagesBySegmentDurability,
  getWeakRetargetingMessagesDurability,
} from "@/modules/growth/cro-retargeting-durability.repository";
import { detectRetargetingLowConversion } from "@/modules/growth/negative-signal-quality.service";
import {
  formatConvRate,
  resolveLearnedListSourceLabel,
  safeSumBookingsFromPerfRows,
} from "@/modules/growth/growth-retargeting-ui-helpers";

const RANGE_DAYS = 14;

export async function GrowthRetargetingEngineSection() {
  const plan = await generateRetargetingPlan(RANGE_DAYS);
  const { audiences: a } = plan;

  const persistOn =
    croRetargetingLearningFlags.croRetargetingPersistenceV1 ||
    croRetargetingDurabilityFlags.croRetargetingDurabilityV1;

  if (persistOn) {
    await loadPersistentCroRetargetingLearning().catch(() => {});
    await retargetingPerformanceReady();
  }

  const [
    perfHealth,
    durHealth,
    hiLearnedMem,
    weakMem,
    rtLowRows,
    hiDb,
    weakDb,
  ] = await Promise.all([
    Promise.resolve(getRetargetingPerformanceHealth()),
    getDurabilityHealth().catch(() => null),
    getTopMessagesBySegment("highIntent", 3),
    getWeakMessages("highIntent"),
    negativeSignalQualityFlags.negativeSignalQualityV1
      ? detectRetargetingLowConversion(RANGE_DAYS).catch(() => [])
      : Promise.resolve([]),
    croRetargetingDurabilityFlags.croRetargetingDurabilityV1
      ? getTopRetargetingMessagesBySegmentDurability("highIntent", 5).catch(() => [])
      : Promise.resolve([]),
    croRetargetingDurabilityFlags.croRetargetingDurabilityV1
      ? getWeakRetargetingMessagesDurability(8).catch(() => [])
      : Promise.resolve([]),
  ]);

  const perfRows = snapshotAll();
  const unified = buildUnifiedSnapshot();
  const autopilot = listRetargetingAutopilotRecommendations({
    highIntentCount: a.highIntent.count,
    abandonedBookings: a.abandonedBookings.count,
    hotLeads: a.hotLeads.count,
  });

  const learnedSource: "DB" | "MEMORY" | "DEFAULT" =
    durHealth && durHealth.performanceSnapshots > 0 ? "DB"
    : perfHealth.hydrated && perfRows.length > 0 ? "MEMORY"
    : "DEFAULT";

  const learnedListLabel = resolveLearnedListSourceLabel({
    learnedSource,
    hiDbLen: hiDb.length,
    weakDbLen: weakDb.length,
    hiMemLen: hiLearnedMem.length,
    weakMemLen: weakMem.length,
  });

  const topForUi =
    learnedSource === "DB" && hiDb.length > 0
      ? hiDb.map((r) => ({
          messageId: r.messageId,
          conversionRate: r.conversionRate,
          bookings: r.bookings,
          clicks: r.clicks,
          evidenceQuality: r.evidenceQuality,
        }))
      : hiLearnedMem.map((p) => ({
          messageId: p.messageId,
          conversionRate: p.conversionRate,
          bookings: p.bookings,
          clicks: p.clicks,
          evidenceQuality: null as string | null,
        }));

  const weakForUi =
    learnedSource === "DB" && weakDb.length > 0
      ? weakDb.map((r) => ({
          messageId: r.messageId,
          clicks: r.clicks,
          bookings: r.bookings,
          segment: r.segment,
          evidenceQuality: r.evidenceQuality,
        }))
      : weakMem.map((p) => ({
          messageId: p.messageId,
          clicks: p.clicks,
          bookings: p.bookings,
          segment: p.segment,
          evidenceQuality: null as string | null,
        }));

  const bookingsLearned = safeSumBookingsFromPerfRows(perfRows);

  const slice = (key: keyof typeof a) => {
    const s = a[key];
    const extra = "anonymousSessions" in s && s.anonymousSessions != null ? ` + ${s.anonymousSessions} anon sessions` : "";
    return (
      <li key={key} className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-sm text-zinc-300">
        <span className="font-medium text-zinc-100">{key}</span>
        <span className="ml-2 tabular-nums text-emerald-400/90">{s.count}</span>
        {extra ? <span className="text-xs text-zinc-500">{extra}</span> : null}
        <p className="mt-1 text-xs text-zinc-500">
          Last activity: {s.lastActivity ? new Date(s.lastActivity).toLocaleString() : "—"}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">{s.conversionGap}</p>
      </li>
    );
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-400/90">Retargeting Engine</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Audiences & suggested campaigns</h2>
        </div>
        <p className="text-xs text-zinc-500">
          Last {RANGE_DAYS} days · tracking only — paste into Meta/Google manually
        </p>
      </div>

      <div className="mt-3 space-y-2 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-400">
        <p>
          <span className="font-medium text-zinc-300">Durability</span> · cache {perfHealth.cacheEntries} rows · hydrated:{" "}
          {perfHealth.hydrated ? "yes" : "no"}
          {durHealth ? (
            <>
              {" "}
              · signals (14d): CRO {durHealth.croSignalRows14d}, RT {durHealth.retargetingSignalRows14d} · perf snapshots:{" "}
              {durHealth.performanceSnapshots}
            </>
          ) : (
            <span className="text-zinc-500"> · health unavailable (DB or flag)</span>
          )}
        </p>
        <p>
          Learned message source:{" "}
          <span className="text-zinc-200">{learnedListLabel}</span>
        </p>
      </div>

      <p className="mt-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400">
        Funnel signal: {plan.funnelNote}
      </p>
      {plan.funnelLinkedSuggestions.length > 0 ? (
        <ul className="mt-2 space-y-1 rounded-lg border border-violet-900/30 bg-violet-950/20 px-3 py-2 text-xs text-zinc-300">
          {plan.funnelLinkedSuggestions.map((x) => (
            <li key={x.condition}>
              <span className="text-zinc-400">{x.condition}:</span> {x.play}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Audience sizes</h3>
          <ul className="mt-3 space-y-2">{(["visitors", "engaged", "highIntent", "hotLeads", "abandonedBookings"] as const).map(slice)}</ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Recommended messages</h3>
          <ul className="mt-3 space-y-3">
            {plan.items.map((item) => (
              <li key={item.segment} className="rounded-lg border border-zinc-800/80 bg-black/25 px-3 py-2">
                <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                <p className="mt-1 text-xs text-zinc-400">{item.message}</p>
                <p className="mt-2 text-sm text-zinc-200">&ldquo;{item.suggestedCopy}&rdquo;</p>
                <p className="mt-2 text-xs text-zinc-500">
                  Urgency: <span className="text-zinc-300">{item.urgency}</span> · {item.frequency}
                </p>
              </li>
            ))}
          </ul>
          {plan.items.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No segments with volume in this window — drive traffic first.</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-violet-900/30 bg-violet-950/15 p-4">
        <h3 className="text-sm font-semibold text-violet-200/90">Performance insights</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Message stats from booking completions with <code className="text-zinc-400">meta.retargeting.messageId</code> + unified hooks (
          {unified.evidenceQualityHint} evidence quality).
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Bookings attributed to retargeting message learning (in-memory cache):{" "}
          <span className="tabular-nums text-zinc-300">{bookingsLearned}</span>
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium text-zinc-500">Best retargeting message (highIntent)</p>
            <ul className="mt-1 space-y-1 text-xs text-zinc-300">
              {topForUi.length === 0 ? (
                <li className="text-zinc-500">Insufficient data — no ranked messages yet.</li>
              ) : (
                topForUi.map((p) => (
                  <li key={p.messageId}>
                    {p.messageId} · conv {formatConvRate(p.conversionRate)} · {p.bookings} bookings · {p.clicks} clicks
                    {p.evidenceQuality ? (
                      <span className="ml-1 text-zinc-500">
                        · evidence: <span className="text-zinc-400">{p.evidenceQuality}</span>
                      </span>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-500">Weak messages</p>
            <ul className="mt-1 space-y-1 text-xs text-zinc-400">
              {weakForUi.length === 0 ? (
                <li>None flagged with current thresholds — needs volume before weak labels.</li>
              ) : (
                weakForUi.map((p) => (
                  <li key={p.messageId}>
                    {p.messageId} · {p.clicks} clicks · {p.bookings} bookings
                    {p.segment ? <span className="text-zinc-600"> · {p.segment}</span> : null}
                    {p.evidenceQuality ? (
                      <span className="ml-1 text-zinc-500">
                        · <span className="text-zinc-400">{p.evidenceQuality}</span>
                      </span>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {rtLowRows.length > 0 ? (
        <div className="mt-6 rounded-xl border border-amber-900/40 bg-amber-950/15 p-4">
          <h3 className="text-sm font-semibold text-amber-200/90">Low-conversion detections (conservative)</h3>
          <ul className="mt-2 space-y-2 text-xs text-zinc-300">
            {rtLowRows.slice(0, 6).map((row, i) => (
              <li key={i} className="rounded border border-zinc-800/60 bg-black/20 px-2 py-1.5">
                <span className="text-zinc-400">
                  {row.entityKind ?? "?"}:{String(row.entityId ?? "?")}
                </span> · quality{" "}
                <span className="text-zinc-200">{row.evidenceQuality ?? "—"}</span>
                {Array.isArray(row.reasons) && row.reasons.length > 0 ? (
                  <p className="mt-1 text-zinc-500">{row.reasons.slice(0, 3).join(" · ")}</p>
                ) : null}
                {Array.isArray(row.warnings) && row.warnings.length > 0 ? (
                  <p className="mt-0.5 text-amber-200/80">{row.warnings.slice(0, 2).join(" · ")}</p>
                ) : null}
              </li>
            ))}
          </ul>
          <details className="mt-2 text-[11px] text-zinc-600">
            <summary className="cursor-pointer text-zinc-500">Debug</summary>
            <p className="mt-1">Row count: {rtLowRows.length}. Enable FEATURE_NEGATIVE_SIGNAL_QUALITY_V1 for SQL layer.</p>
          </details>
        </div>
      ) : negativeSignalQualityFlags.negativeSignalQualityV1 ? (
        <p className="mt-4 text-xs text-zinc-500">No supported low-conversion retargeting patterns in this window (volume thresholds).</p>
      ) : null}

      <div className="mt-8 border-t border-zinc-800/80 pt-6">
        <h3 className="text-sm font-semibold text-zinc-200">Autopilot (recommendations only · LOW risk)</h3>
        <ul className="mt-3 space-y-2">
          {autopilot.map((x) => (
            <li key={x.actionType} className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm">
              <span className="font-medium text-emerald-200">{x.title}</span>
              <p className="mt-1 text-xs text-zinc-400">{x.summary}</p>
            </li>
          ))}
        </ul>
        {autopilot.length === 0 ? <p className="mt-2 text-xs text-zinc-500">No autopilot suggestions for current volumes.</p> : null}
      </div>
    </section>
  );
}
