import Link from "next/link";
import { adsAiAutomationFlags } from "@/config/feature-flags";
import { runAdsAutomationLoop } from "@/modules/ads/ads-automation-loop.service";
import { listAdsAutomationLoopRecommendations } from "@/modules/ads/ads-automation-loop-bridge";
import { buildWeeklyOperatorChecklist } from "@/modules/ads/ads-operator-routine.service";
import { getLearningMemoryHighlights } from "@/modules/ads/ads-learning-store.service";
import { listAdsAutomationLoopRuns } from "@/modules/ads/ads-automation-history.service";
import { classifyEvidenceQuality } from "@/modules/ads/ads-evidence-score.service";
import { getAdsAutopilotV8MonitoringSnapshot } from "@/modules/ai-autopilot/actions/ads-automation-loop.autopilot.adapter.monitoring";

export async function GrowthAutomationLoopSection() {
  if (!adsAiAutomationFlags.aiAdsAutomationLoopV1) {
    return null;
  }

  const loop = await runAdsAutomationLoop({ rangeDays: 14 });
  const memory = getLearningMemoryHighlights();
  const routine = buildWeeklyOperatorChecklist();
  const bridge = listAdsAutomationLoopRecommendations();

  const history =
    adsAiAutomationFlags.aiAdsAutomationHistoryV1 ? await listAdsAutomationLoopRuns(5).catch(() => []) : [];

  return (
    <section className="rounded-2xl border border-cyan-900/40 bg-cyan-950/15 p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400/90">Automation loop</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Safe AI growth engine</h2>
        </div>
        <p className="max-w-lg text-xs text-zinc-500">
          Recommendations only — no ad APIs, no auto-spend, no auto-publish. Evidence scores are heuristic reliability
          hints, not predictions.
        </p>
      </div>

      <p className="mt-4 rounded-lg border border-cyan-900/30 bg-black/20 p-3 text-sm text-zinc-300">{loop.summary}</p>
      <p className="mt-2 text-xs text-zinc-500">
        <span className="font-semibold text-cyan-200/90">Confidence {(loop.confidence * 100).toFixed(0)}%</span>
        <span className="mx-2">·</span>
        {loop.why}
      </p>

      {loop.warnings.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-200/90">
          {loop.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link
          href="#lecipm-platform-core"
          className="text-xs font-medium text-cyan-300/90 underline decoration-cyan-700/60 underline-offset-2 hover:text-cyan-200"
        >
          View in Platform Core
        </Link>
      </div>

      {adsAiAutomationFlags.adsAutopilotV8RolloutV1 ? (
        <div className="mt-2 rounded-lg border border-zinc-800/60 bg-black/15 px-3 py-2 text-[11px] text-zinc-500">
          <span className="font-semibold text-zinc-400">Ads V8 adapter (process-local)</span> · primary{" "}
          {adsAiAutomationFlags.adsAutopilotV8PrimaryV1 ? (
            <span className="text-cyan-300/90">on</span>
          ) : (
            <span className="text-zinc-500">off</span>
          )}
          {(() => {
            const s = getAdsAutopilotV8MonitoringSnapshot();
            return (
              <>
                {" "}
                · V8 primary OK {s.v8PrimarySuccessCount} · fallback {s.v8PrimaryFallbackCount}
                {s.lastPrimaryPathLabel ? (
                  <>
                    {" "}
                    · last <span className="text-zinc-400">{s.lastPrimaryPathLabel}</span>
                  </>
                ) : null}
                {s.recentPrimaryFallbackReasons.length > 0 ? (
                  <span className="block mt-1 text-zinc-600">
                    Recent fallback reasons: {s.recentPrimaryFallbackReasons.slice(-4).join(", ")}
                  </span>
                ) : null}
              </>
            );
          })()}
        </div>
      ) : null}

      <div className="mt-3 rounded-lg border border-zinc-800/70 bg-black/20 px-3 py-2 text-[11px] text-zinc-500">
        <span className="font-semibold text-zinc-400">Persistence</span> ·{" "}
        {loop.persistenceStatus.persisted ? (
          <span className="text-emerald-400/90">
            saved {loop.loopRunId ? `run ${loop.loopRunId.slice(0, 8)}…` : ""}
            {loop.persistenceStatus.learningPersisted ? " · learning synced" : ""}
          </span>
        ) : (
          <span>
            in-memory only — enable <code className="text-cyan-300/80">FEATURE_AI_ADS_AUTOMATION_PERSISTENCE_V1</code>{" "}
            for DB audit trail
          </span>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800/80 bg-black/25">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs text-zinc-400">
          <thead>
            <tr className="border-b border-zinc-800/80 text-[10px] uppercase tracking-wide text-zinc-500">
              <th className="px-3 py-2">Campaign</th>
              <th className="px-3 py-2">Class</th>
              <th className="px-3 py-2">Conf</th>
              <th className="px-3 py-2">Evidence</th>
              <th className="px-3 py-2">Imp</th>
              <th className="px-3 py-2">Clk</th>
              <th className="px-3 py-2">Leads</th>
              <th className="px-3 py-2">Book</th>
              <th className="px-3 py-2">CTR</th>
              <th className="px-3 py-2">CPL</th>
              <th className="px-3 py-2">Conv</th>
              <th className="px-3 py-2">Geo</th>
            </tr>
          </thead>
          <tbody>
            {loop.classifiedWithEvidence.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-3 text-zinc-500">
                  No UTM campaigns in window.
                </td>
              </tr>
            ) : (
              loop.classifiedWithEvidence.map((row) => (
                <tr key={row.campaign.campaignKey} className="border-b border-zinc-900/80">
                  <td className="px-3 py-2 font-mono text-cyan-200/90">{row.campaign.campaignKey}</td>
                  <td className="px-3 py-2">{row.classification}</td>
                  <td className="px-3 py-2">{(row.confidence * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2">
                    {(row.evidenceScore * 100).toFixed(0)}% · {row.evidenceQuality}
                  </td>
                  <td className="px-3 py-2">{row.metricsSnapshot.impressions}</td>
                  <td className="px-3 py-2">{row.metricsSnapshot.clicks}</td>
                  <td className="px-3 py-2">{row.metricsSnapshot.leads}</td>
                  <td className="px-3 py-2">{row.metricsSnapshot.bookingsCompleted}</td>
                  <td className="px-3 py-2">{row.metricsSnapshot.ctrPercent ?? "—"}</td>
                  <td className="px-3 py-2">{row.metricsSnapshot.cpl ?? "—"}</td>
                  <td className="px-3 py-2">{row.metricsSnapshot.conversionRatePercent ?? "—"}</td>
                  <td className="px-3 py-2">{row.geoSummary?.available ? "yes" : "no"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {loop.recommendations.map((r, i) => {
          const q = r.evidenceScore != null ? classifyEvidenceQuality(r.evidenceScore) : "LOW";
          return (
            <div key={`${r.recommendationType}-${i}`} className="rounded-xl border border-zinc-800/80 bg-black/25 p-4">
              <p className="text-xs font-semibold text-cyan-200/90">{r.recommendationType.replace(/_/g, " ")}</p>
              {r.targetKey ? (
                <p className="mt-1 font-mono text-[11px] text-zinc-500">{r.targetKey}</p>
              ) : null}
              <p className="mt-2 text-[11px] text-zinc-500">
                Priority {r.priority} · conf {(r.confidence != null ? r.confidence * 100 : 0).toFixed(0)}% · evidence{" "}
                {r.evidenceScore != null ? `${(r.evidenceScore * 100).toFixed(0)}% (${q})` : "—"}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-400">
                {r.reasons.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-zinc-300">{r.operatorAction}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800/80 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Winners</h3>
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs text-zinc-400">
            {loop.winners.length === 0 ? (
              <li>No classified winners in this window (volume or thresholds).</li>
            ) : (
              loop.winners.map((w) => (
                <li key={w.campaignKey} className="rounded border border-zinc-800/50 px-2 py-1">
                  <span className="text-cyan-200/90">{w.campaignKey}</span> · CTR {w.ctrPercent ?? "—"}% · leads{" "}
                  {w.leads}
                </li>
              ))
            )}
          </ul>
          <h3 className="mt-4 text-sm font-semibold text-zinc-100">Weak / review</h3>
          <ul className="mt-2 max-h-32 space-y-2 overflow-y-auto text-xs text-zinc-400">
            {loop.losers.length === 0 ? (
              <li>None flagged as weak by rules.</li>
            ) : (
              loop.losers.map((w) => (
                <li key={w.campaignKey} className="rounded border border-rose-900/30 px-2 py-1">
                  {w.campaignKey} · CTR {w.ctrPercent ?? "—"}%
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Aggregate optimization</h3>
          <p className="mt-1 text-xs text-zinc-500">{loop.optimizations.summary}</p>
          <p className="mt-2 text-xs font-medium text-cyan-200/90">→ {loop.optimizations.recommendation}</p>
          <h4 className="mt-3 text-xs font-semibold text-zinc-400">New variants (from winners)</h4>
          <ul className="mt-2 space-y-3 text-xs text-zinc-400">
            {loop.newVariants.length === 0 ? (
              <li>No variant packs — need at least one classified winner.</li>
            ) : (
              loop.newVariants.map((v) => (
                <li key={v.campaignKey} className="rounded border border-zinc-800/60 p-2">
                  <p className="text-zinc-300">{v.campaignKey}</p>
                  <p className="mt-1 text-zinc-500">
                    {(v.confidence * 100).toFixed(0)}% confidence — {v.rationale}
                  </p>
                  {v.whyThisVariantSet ? <p className="mt-1 text-[11px] text-zinc-600">{v.whyThisVariantSet}</p> : null}
                  {v.warnings && v.warnings.length > 0 ? (
                    <p className="mt-1 text-[11px] text-amber-200/80">{v.warnings.join(" · ")}</p>
                  ) : null}
                  <p className="mt-1 text-zinc-400">H1: {v.headlines[0]}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800/80 bg-black/25 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Next test plan</h3>
        <p className="mt-1 text-[11px] text-zinc-500">
          Overall evidence quality: {loop.nextTests.evidenceQualityOverall}. Geo hints:{" "}
          {loop.nextTests.geoExperimentHints.length ? loop.nextTests.geoExperimentHints.join(" · ") : "—"}
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Keep running", loop.nextTests.keepRunning],
              ["Pause (manual)", loop.nextTests.pause],
              ["Duplicate / scale", loop.nextTests.duplicateAndScale],
              ["New variants", loop.nextTests.newVariantsToTest],
              ["Audience experiments", loop.nextTests.audienceExperiments],
              ["Landing experiments", loop.nextTests.landingPageExperiments],
              ["Hold (low data)", loop.nextTests.holdForMoreData],
            ] as const
          ).map(([label, items]) => (
            <div key={label}>
              <p className="text-xs font-semibold text-zinc-400">{label}</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-zinc-500">
                {items.length === 0 ? <li>—</li> : items.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
        {loop.nextTests.enrichedRows.length > 0 ? (
          <div className="mt-4 border-t border-zinc-800/60 pt-4">
            <p className="text-xs font-semibold text-zinc-400">Evidence-backed notes</p>
            <ul className="mt-2 space-y-2 text-[11px] text-zinc-500">
              {loop.nextTests.enrichedRows.map((e) => (
                <li key={e.label}>
                  <span className="text-zinc-300">{e.label}</span> — {e.rationale}{" "}
                  <span className="text-zinc-600">({e.evidenceQuality})</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Learning memory (highlights)</h3>
          <dl className="mt-2 space-y-2 text-xs text-zinc-400">
            <div>
              <dt className="text-zinc-500">Hooks</dt>
              <dd>{memory.topHooks.slice(0, 3).join(" · ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Hooks to avoid</dt>
              <dd>{memory.hooksToAvoid.slice(0, 3).join(" · ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Audiences</dt>
              <dd>{memory.topAudiences.slice(0, 3).join(" · ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">CTAs</dt>
              <dd>{memory.topCtas.join(" · ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Weak CTAs</dt>
              <dd>{memory.weakCtas.join(" · ") || "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-zinc-800/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Landing feedback</h3>
          <ul className="mt-2 space-y-3 text-xs text-zinc-400">
            {loop.landing.map((l, i) => (
              <li key={`${l.kind}-${i}`} className="rounded border border-zinc-800/50 p-2">
                <p>
                  <span className="text-cyan-200/90">{(l.confidence * 100).toFixed(0)}%</span> ·{" "}
                  <span className="text-zinc-300">{l.issueType}</span> · severity {l.severity}
                </p>
                <p className="mt-1 text-zinc-300">{l.message}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Evidence score {(l.evidenceScore * 100).toFixed(0)}% ({l.evidenceQuality})
                </p>
                <p className="mt-1 text-zinc-500">{l.operatorAction}</p>
                {l.recommendedExperiments.length > 0 ? (
                  <p className="mt-1 text-[10px] text-zinc-600">Tests: {l.recommendedExperiments.join(", ")}</p>
                ) : null}
                <p className="mt-1 text-[10px] text-zinc-600">{l.evidence}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="mt-6 rounded-xl border border-zinc-800/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Recent loop runs</h3>
          <ul className="mt-2 space-y-2 text-xs text-zinc-500">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap gap-2 border-b border-zinc-900/60 py-2">
                <span className="text-zinc-400">{new Date(h.createdAt).toLocaleString()}</span>
                <span>
                  W {h.winnersCount} / weak {h.weakCount} / ? {h.uncertainCount}
                </span>
                {h.confidence != null ? <span>conf {(h.confidence * 100).toFixed(0)}%</span> : null}
                <span className="max-w-prose text-zinc-600">{h.summary?.slice(0, 120)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <details className="mt-6 rounded-lg border border-zinc-800/50 bg-black/20 p-3 text-[11px] text-zinc-600">
        <summary className="cursor-pointer text-zinc-400">Debug: raw checklist</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(loop.operatorChecklist, null, 2)}</pre>
      </details>

      <div className="mt-6 rounded-xl border border-zinc-800/60 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Weekly operator rhythm</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {(Object.keys(routine) as (keyof typeof routine)[]).map((day) => (
            <div key={day}>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{day}</p>
              {routine[day].map((block) => (
                <div key={block.title} className="mt-2">
                  <p className="text-xs text-zinc-400">{block.title}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-zinc-500">
                    {block.tasks.map((t) => (
                      <li key={t.id}>
                        {t.label}: {t.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800/60 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Autopilot action types (reference)</h3>
        <ul className="mt-2 space-y-1 text-xs text-zinc-500">
          {bridge.map((b) => (
            <li key={b.actionType}>
              <code className="text-cyan-300/80">{b.actionType}</code> — {b.title}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
