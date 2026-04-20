import type { LegalFraudOperationalIndicator } from "@/modules/legal/legal-fraud-engine.service";

export function LegalFraudIndicatorsTable({ indicators }: { indicators: LegalFraudOperationalIndicator[] }) {
  if (!indicators.length) {
    return (
      <p className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs text-zinc-500">No indicators.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-zinc-800 bg-[#141414] text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">Severity</th>
            <th className="px-3 py-2 font-medium">Label</th>
            <th className="px-3 py-2 font-medium">Posture</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {indicators.map((i) => (
            <tr key={i.id} className="text-zinc-300">
              <td className="px-3 py-2 font-mono uppercase text-[10px]">{i.severity}</td>
              <td className="px-3 py-2">
                <p>{i.label}</p>
                <p className="mt-1 text-[10px] text-zinc-500">{i.explanation}</p>
              </td>
              <td className="px-3 py-2 font-mono text-[10px] text-amber-200/90">{i.recommendedReviewPosture}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
