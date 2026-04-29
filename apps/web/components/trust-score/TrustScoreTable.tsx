import type {
  LecipmTrustEngineTargetType,
  LecipmTrustOperationalBand,
} from "@/types/trust-enums-client";

export type TrustScoreRow = {
  targetType: LecipmTrustEngineTargetType;
  targetId: string;
  trustScore: number;
  trustBand: LecipmTrustOperationalBand;
  deltaFromPrior: number | null;
  snapshotAt: string;
};

export function TrustScoreTable(props: { title: string; rows: TrustScoreRow[]; emptyHint: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#D4AF37]/20 bg-black/40">
      <div className="border-b border-[#D4AF37]/15 px-4 py-3">
        <h3 className="font-serif text-lg text-[#f4efe4]">{props.title}</h3>
      </div>
      <table className="min-w-full text-left text-sm text-[#e8dfd0]">
        <thead className="text-[11px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2">Target</th>
            <th className="px-4 py-2">Score</th>
            <th className="px-4 py-2">Band</th>
            <th className="px-4 py-2">Δ</th>
            <th className="px-4 py-2">Snapshot</th>
          </tr>
        </thead>
        <tbody>
          {props.rows.length === 0 ?
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-xs text-zinc-500">
                {props.emptyHint}
              </td>
            </tr>
          : props.rows.map((r) => (
              <tr key={`${r.targetType}:${r.targetId}:${r.snapshotAt}`} className="border-t border-[#D4AF37]/10">
                <td className="px-4 py-2 font-mono text-xs">
                  {r.targetType} · {r.targetId.slice(0, 12)}…
                </td>
                <td className="px-4 py-2">{r.trustScore}</td>
                <td className="px-4 py-2">{r.trustBand}</td>
                <td className="px-4 py-2">{r.deltaFromPrior ?? "—"}</td>
                <td className="px-4 py-2 text-xs text-zinc-400">{new Date(r.snapshotAt).toLocaleString()}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
