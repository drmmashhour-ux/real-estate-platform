"use client";

import type { CompanyCommandCenterV6Payload } from "../../company-command-center-v6.types";
import { AuditTrailList } from "../shared/AuditTrailList";

export function AuditTrailModeView({ data }: { data: CompanyCommandCenterV6Payload }) {
  const audit = data.modes.auditTrail;
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
        <p className="text-sm text-zinc-200">{audit.summary}</p>
        <p className="mt-2 text-[10px] text-zinc-600">
          When history is sparse, entries rely on digest and window deltas — interpret as operational traceability, not a
          formal audit log.
        </p>
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Traceability notes</h4>
        <ul className="mt-2 space-y-1 text-xs text-zinc-500">
          {audit.traceabilityNotes.map((t) => (
            <li key={t.id}>{t.text}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">All entries ({audit.entries.length})</h4>
        <div className="mt-2">
          <AuditTrailList entries={audit.entries} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Grouped by system</h4>
          <div className="mt-2 space-y-4">
            {audit.groupedBySystem.length ? (
              audit.groupedBySystem.map((g) => (
                <div key={g.key}>
                  <p className="text-xs font-medium text-zinc-400">{g.label}</p>
                  <div className="mt-1">
                    <AuditTrailList entries={g.entries} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-600">No system groups.</p>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Grouped by severity</h4>
          <div className="mt-2 space-y-4">
            {audit.groupedBySeverity.length ? (
              audit.groupedBySeverity.map((g) => (
                <div key={g.key}>
                  <p className="text-xs font-medium text-zinc-400">{g.label}</p>
                  <div className="mt-1">
                    <AuditTrailList entries={g.entries} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-600">No severity groups.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
