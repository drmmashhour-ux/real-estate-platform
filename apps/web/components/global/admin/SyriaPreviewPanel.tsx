import type { ListingPreviewResponse } from "@/modules/autonomous-marketplace/types/listing-preview.types";
import type { SyriaOpportunity, SyriaSignal } from "@/modules/integrations/regions/syria/syria-signal.types";

type Props = {
  listingId: string;
  preview: ListingPreviewResponse | null;
};

/** Admin-only Syria autonomous preview — DRY_RUN / read-only; server-rendered. */
export function SyriaPreviewPanel(props: Props) {
  const { listingId, preview } = props;

  if (!listingId) {
    return (
      <section className="rounded-2xl border border-amber-500/20 bg-[#0a0a0a] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/90">Syria preview</h2>
        <p className="mt-2 text-sm text-zinc-500">Add <code className="text-zinc-400">?syriaListing=&lt;id&gt;</code> to preview a Syria listing.</p>
      </section>
    );
  }

  if (!preview) {
    return (
      <section className="rounded-2xl border border-amber-500/20 bg-[#0a0a0a] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/90">Syria preview</h2>
        <p className="mt-2 text-sm text-zinc-500">No preview payload — check flags and listing id.</p>
      </section>
    );
  }

  const m = preview.metrics;
  const obs = preview.observation;
  const syPolicy = preview.syriaPolicyPreview;
  const sySignals = preview.syriaSignals ?? [];
  const syOpps = preview.syriaOpportunities ?? [];
  const syExplain = [...(preview.syriaSignalExplainability ?? [])];

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-[#0a0a0a] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/90">Syria preview (read-only)</h2>
          <p className="mt-1 font-mono text-xs text-zinc-500">{listingId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-200">
            DRY_RUN
          </span>
          <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-[10px] uppercase text-zinc-400">no execution</span>
        </div>
      </div>

      {preview.regionListingRef?.displayId ? (
        <p className="mt-3 text-xs text-zinc-500">
          Stable key: <span className="font-mono text-zinc-300">{preview.regionListingRef.displayId}</span>
        </p>
      ) : null}

      {preview.previewNotes && preview.previewNotes.length > 0 ? (
        <ul className="mt-4 list-inside list-disc text-xs text-amber-200/80">
          {preview.previewNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PreviewMetric label="Metrics snapshot" value={m ? "present" : "missing"} />
        <PreviewMetric label="Bookings (hint)" value={m?.bookings ?? "—"} />
        <PreviewMetric label="Price (major units)" value={m?.price ?? "—"} />
        <PreviewMetric label="Status" value={m?.listingStatus ?? "—"} />
      </div>

      {syPolicy ? (
        <div
          className={`mt-6 rounded-xl px-4 py-3 ${
            syPolicy.decision === "blocked_for_region"
              ? "border border-rose-500/40 bg-rose-950/30"
              : "border border-amber-500/15 bg-zinc-950/50"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Syria policy</p>
          <p className="mt-1 text-sm text-amber-100/90">
            <span className="font-mono text-xs text-amber-300/90">{syPolicy.decision}</span>
            <span className="mx-2 text-zinc-600">·</span>
            <span className="text-zinc-400">{syPolicy.rationale}</span>
          </p>
        </div>
      ) : null}

      {preview.syriaApprovalBoundary ? (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-950/20 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Approval & execution boundary</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                preview.syriaApprovalBoundary.requiresHumanApprovalHint
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
                  : "border-zinc-600 text-zinc-400"
              }`}
            >
              human review {preview.syriaApprovalBoundary.requiresHumanApprovalHint ? "suggested" : "optional"}
            </span>
            <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-400">
              live exec blocked
            </span>
          </div>
          <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
            {preview.syriaApprovalBoundary.reasons.map((r) => (
              <li key={r} className="font-mono">
                {r}
              </li>
            ))}
          </ul>
          {preview.syriaApprovalBoundary.notes.length > 0 ? (
            <ul className="mt-2 list-inside list-disc text-xs text-zinc-400">
              {[...preview.syriaApprovalBoundary.notes].map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Observation signals</h3>
          <p className="mt-2 text-sm text-zinc-400">{obs.signals.length} normalized signal row(s)</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">FSBO detector opportunities</h3>
          <p className="mt-2 text-sm text-zinc-400">{preview.opportunities.length} opportunit(y/ies)</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Syria region signals</h3>
        {sySignals.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No Syria signals for current facts.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {groupSyriaSignals(sySignals).map((g) => (
              <li key={g.severity} className="rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={g.severity} />
                  <span className="text-[10px] uppercase text-zinc-500">{g.items.length} in group</span>
                </div>
                <ul className="mt-2 space-y-1.5 text-xs text-zinc-300">
                  {g.items.map((s) => (
                    <li key={s.type} className="flex flex-col gap-0.5 border-l border-amber-500/20 pl-2">
                      <span className="font-mono text-[11px] text-amber-200/80">{s.type}</span>
                      <span className="text-zinc-500">{s.message}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Syria opportunities</h3>
        {syOpps.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No Syria opportunities (max five, derived from signals).</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {syOpps.map((o) => (
              <li key={o.id} className="rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityPill priority={o.priority} />
                  <span className="text-sm font-medium text-zinc-100">{o.title}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{o.description}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-600">{o.signalType}</p>
                <ul className="mt-1 list-inside list-disc text-xs text-zinc-400">
                  {o.suggestedActions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      {syExplain.length > 0 ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Syria explainability</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
            {syExplain.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Policy decisions</h3>
        <p className="mt-2 text-sm text-zinc-400">{preview.policyDecisions.length} decision(s)</p>
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Proposed actions</h3>
        <p className="mt-2 text-sm text-zinc-400">{preview.proposedActions.length} action(s)</p>
      </div>

      {preview.explainability ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Explainability</h3>
          <p className="mt-2 text-sm text-zinc-300">{preview.explainability.summary}</p>
          {preview.explainability.notes.length > 0 ? (
            <ul className="mt-3 list-inside list-disc text-xs text-zinc-500">
              {[...preview.explainability.notes].slice(0, 12).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {preview.capabilityNotes && preview.capabilityNotes.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Capability notes</h3>
          <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
            {preview.capabilityNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function groupSyriaSignals(signals: SyriaSignal[]): { severity: SyriaSignal["severity"]; items: SyriaSignal[] }[] {
  const order: SyriaSignal["severity"][] = ["critical", "warning", "info"];
  const map = new Map<SyriaSignal["severity"], SyriaSignal[]>();
  for (const s of signals) {
    const arr = map.get(s.severity) ?? [];
    arr.push(s);
    map.set(s.severity, arr);
  }
  return order.filter((sev) => map.has(sev)).map((severity) => ({
    severity,
    items: (map.get(severity) ?? []).sort((a, b) => a.type.localeCompare(b.type)),
  }));
}

function SeverityBadge(props: { severity: SyriaSignal["severity"] }) {
  const cls =
    props.severity === "critical"
      ? "border-red-500/50 bg-red-950/40 text-red-200"
      : props.severity === "warning"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
        : "border-zinc-600 bg-zinc-900/60 text-zinc-300";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>{props.severity}</span>
  );
}

function PriorityPill(props: { priority: SyriaOpportunity["priority"] }) {
  const cls =
    props.priority === "high"
      ? "border-amber-400/50 text-amber-100"
      : props.priority === "medium"
        ? "border-zinc-500 text-zinc-300"
        : "border-zinc-700 text-zinc-500";
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>{props.priority}</span>
  );
}

function PreviewMetric(props: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{props.label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{props.value}</p>
    </div>
  );
}
