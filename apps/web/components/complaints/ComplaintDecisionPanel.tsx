"use client";

export type ComplaintDecisionPanelProps = {
  classification: string;
  recommendedRoute: string;
  requiresComplianceReview: boolean;
  requiresLegalReview: boolean;
  canResolveInternally: boolean;
  nextActions: string[];
};

export function ComplaintDecisionPanel(props: ComplaintDecisionPanelProps) {
  return (
    <div className="rounded-xl border border-gray-700 bg-zinc-950 p-4 text-white space-y-3">
      <h3 className="text-sm font-semibold text-[#D4AF37]">Decision</h3>
      <div className="text-sm text-gray-300">
        <div>
          <span className="text-gray-500">Classification:</span> {props.classification}
        </div>
        <div>
          <span className="text-gray-500">Route:</span> {props.recommendedRoute}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {props.requiresComplianceReview ? (
          <span className="rounded bg-amber-900/40 text-amber-200 px-2 py-1">Compliance review</span>
        ) : null}
        {props.requiresLegalReview ? (
          <span className="rounded bg-red-900/30 text-red-200 px-2 py-1">Legal review</span>
        ) : null}
        <span className="rounded bg-gray-800 px-2 py-1">
          {props.canResolveInternally ? "May resolve internally" : "External / supervised path"}
        </span>
      </div>
      <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
        {props.nextActions.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </div>
  );
}
