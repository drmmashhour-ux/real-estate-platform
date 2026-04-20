import type { UnifiedListingReadModel } from "@/modules/unified-intelligence/unified-intelligence.types";
import { UnifiedAuditCard } from "./UnifiedAuditCard";
import { UnifiedExecutionCard } from "./UnifiedExecutionCard";
import { UnifiedGrowthCard } from "./UnifiedGrowthCard";
import { UnifiedLegalTrustCard } from "./UnifiedLegalTrustCard";
import { UnifiedSourceStatusCard } from "./UnifiedSourceStatusCard";

export function UnifiedListingIntelligencePanel(props: {
  model: UnifiedListingReadModel | null;
  disabledReason?: string;
}) {
  if (props.disabledReason) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-amber-950/30 p-6 text-sm text-amber-200/90">
        {props.disabledReason}
      </div>
    );
  }

  if (!props.model) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-500">
        Enter a listing id and load the read model (read-only API:{" "}
        <code className="text-slate-400">GET /api/admin/unified-intelligence/listing</code>).
      </div>
    );
  }

  const m = props.model;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-6">
        <p className="text-xs uppercase tracking-widest text-slate-500">Unified listing intelligence</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-100">
          Listing <span className="font-mono text-premium-gold">{m.listingId || "—"}</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Source: <span className="text-slate-300">{m.source}</span> — one panel; facets are derived, not duplicated CRM rows.
        </p>
        {m.preview ? (
          <p className="mt-3 text-xs text-slate-600">
            Preview / explainability:{" "}
            <code className="rounded bg-black/40 px-1 py-0.5 text-[10px] text-slate-500">
              {JSON.stringify(m.preview)}
            </code>
          </p>
        ) : null}
      </div>

      <UnifiedSourceStatusCard sourceStatus={m.sourceStatus} />

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Observation</p>
        <pre className="mt-4 max-h-56 overflow-auto text-[11px] text-slate-400">
          {m.observation ? JSON.stringify(m.observation, null, 2) : "{}"}
        </pre>
      </div>

      <UnifiedLegalTrustCard compliance={m.compliance} legalRisk={m.legalRisk} trust={m.trust} />

      <UnifiedGrowthCard growth={m.growth} ranking={m.ranking} />

      <UnifiedExecutionCard execution={m.execution} governance={m.governance} />

      <UnifiedAuditCard auditSummary={m.auditSummary} freshness={m.freshness} />

      {m.availabilityNotes.length > 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-black/30 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Availability notes</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500">
            {m.availabilityNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
