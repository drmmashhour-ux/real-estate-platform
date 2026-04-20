import { loadLegalPolicyRecordStats } from "@/lib/autonomy/legal-policy-stats";

/**
 * Autonomous marketplace — recent `metadataJson.domain === "legal"` policy rows (append-only audit from engine runs).
 */
export async function LegalPolicyViolationsPanel() {
  const stats = await loadLegalPolicyRecordStats();
  if (!stats) {
    return (
      <p className="text-sm text-amber-200/80">
        Could not load policy records. Check database connectivity and `AutonomousMarketplacePolicyRecord` migrations.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-black/25 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Legal rows (recent sample)</div>
          <div className="font-mono text-lg text-zinc-200">{stats.totalLegal}</div>
        </div>
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-red-400/90">Blocked</div>
          <div className="font-mono text-lg text-red-200">{stats.blocked}</div>
        </div>
        <div className="rounded-lg border border-amber-900/35 bg-amber-950/15 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-amber-400/90">Warnings</div>
          <div className="font-mono text-lg text-amber-200">{stats.warning}</div>
        </div>
      </div>

      {stats.topBlockingKeys.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Most frequent missing keys</h3>
          <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-400">
            {stats.topBlockingKeys.map((k) => (
              <li key={k.key}>
                <span className="text-zinc-300">{k.key}</span>{" "}
                <span className="text-zinc-600">× {k.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-zinc-600">No blocking requirement keys recorded in the recent legal-policy sample.</p>
      )}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Recent legal policy rows</h3>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-xs text-zinc-400">
            <thead className="sticky top-0 bg-zinc-950/95 text-zinc-500">
              <tr className="border-b border-zinc-800">
                <th className="px-2 py-2">When</th>
                <th className="px-2 py-2">Result</th>
                <th className="px-2 py-2">Gate</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((r, i) => (
                <tr key={`${r.createdAt.toISOString()}-${i}`} className="border-b border-zinc-900/80">
                  <td className="px-2 py-2 font-mono text-zinc-500">{r.createdAt.toISOString().slice(0, 19)}Z</td>
                  <td className="px-2 py-2 text-zinc-300">{r.result}</td>
                  <td className="px-2 py-2 font-mono text-zinc-400">{r.legalGateAction ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-zinc-600">
        Readiness distribution would require Legal Hub aggregates — not stored on policy rows. Use Legal Hub analytics or BI
        for score histograms.
      </p>
    </div>
  );
}
