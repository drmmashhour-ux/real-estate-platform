import type { LegalFraudReviewSignal } from "@/modules/legal/legal-fraud-engine.service";

export function LegalFraudReviewSignalsCard({ signals }: { signals: LegalFraudReviewSignal[] }) {
  if (!signals.length) {
    return (
      <p className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs text-zinc-500">
        No prioritized review signals.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {signals.map((s) => (
        <li key={s.id} className="rounded-lg border border-zinc-800 bg-[#111] p-3 text-xs">
          <p className="font-semibold text-zinc-200">{s.headline}</p>
          <p className="mt-1 text-zinc-500">{s.detail}</p>
          <p className="mt-2 font-mono text-[10px] text-zinc-600">
            posture={s.recommendedReviewPosture} · severity={s.severity}
          </p>
        </li>
      ))}
    </ul>
  );
}
