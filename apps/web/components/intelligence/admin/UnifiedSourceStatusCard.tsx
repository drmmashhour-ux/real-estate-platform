import type { UnifiedIntelligenceSourceStatus } from "@/modules/unified-intelligence/unified-intelligence.types";

function levelClass(s: "available" | "missing" | "partial") {
  if (s === "available") return "text-emerald-400";
  if (s === "partial") return "text-amber-400";
  return "text-rose-400";
}

export function UnifiedSourceStatusCard(props: { sourceStatus: UnifiedIntelligenceSourceStatus }) {
  const s = props.sourceStatus;
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Source status</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-600">Canonical runs</dt>
          <dd className={`font-medium ${levelClass(s.canonicalRuns)}`}>{s.canonicalRuns}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-600">Event timeline</dt>
          <dd className={`font-medium ${levelClass(s.eventTimeline)}`}>{s.eventTimeline}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-600">Legal / trust</dt>
          <dd className={`font-medium ${levelClass(s.legalTrust)}`}>{s.legalTrust}</dd>
        </div>
      </dl>
      {s.notes.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 pl-4 text-xs text-slate-500">
          {s.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
