"use client";

export function FormDependencyPanel({
  requiredForms,
  recommendedForms,
  blockingMissingForms,
  notes,
}: {
  requiredForms: string[];
  recommendedForms: string[];
  blockingMissingForms: string[];
  notes: string[];
}) {
  return (
    <div className="rounded-xl border border-ds-border/60 bg-black/35 p-4 text-sm">
      <h4 className="font-medium text-ds-text">Cross-form dependencies (workflow hints)</h4>
      <ul className="mt-2 space-y-1 text-xs text-ds-text-secondary">
        <li>
          <span className="text-ds-text">Required (hints):</span> {requiredForms.join(", ") || "—"}
        </li>
        <li>
          <span className="text-ds-text">Recommended:</span> {recommendedForms.join(", ") || "—"}
        </li>
        <li>
          <span className="text-ds-text">Blocking gaps:</span>{" "}
          {blockingMissingForms.length ? (
            <span className="text-amber-200">{blockingMissingForms.join(", ")}</span>
          ) : (
            "—"
          )}
        </li>
      </ul>
      {notes.length ? (
        <ul className="mt-2 list-disc pl-4 text-xs text-ds-text-secondary">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
