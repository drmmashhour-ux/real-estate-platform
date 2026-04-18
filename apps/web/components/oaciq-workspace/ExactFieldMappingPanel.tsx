"use client";

import { MissingFieldChip } from "@/components/oaciq-forms/MissingFieldChip";

type Trace = { fieldKey: string; sourcePath: string; confidence: number; unmapped?: boolean };

export function ExactFieldMappingPanel({
  missingRequiredKeys,
  fieldTrace,
  debug,
}: {
  missingRequiredKeys: string[];
  fieldTrace: Trace[];
  debug: boolean;
}) {
  return (
    <div className="rounded-xl border border-ds-border/60 bg-black/35 p-4">
      <h4 className="text-sm font-medium text-ds-text">Field mapping</h4>
      {missingRequiredKeys.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-ds-text-secondary">Missing required:</span>
          {missingRequiredKeys.map((k) => (
            <MissingFieldChip key={k} fieldKey={k} />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-ds-text-secondary">No required keys missing at first pass.</p>
      )}
      {debug ? (
        <ul className="mt-3 max-h-48 overflow-auto font-mono text-[10px] text-ds-text-secondary">
          {fieldTrace.slice(0, 40).map((t) => (
            <li key={t.fieldKey}>
              {t.fieldKey} ← {t.sourcePath} ({t.confidence.toFixed(2)}){t.unmapped ? " *" : ""}
            </li>
          ))}
          {fieldTrace.length > 40 ? <li>…</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
