import type { LegalRiskCardModel } from "@/modules/legal/legal-view-model.service";

const BORDER: Record<LegalRiskCardModel["severity"], string> = {
  critical: "border-red-500/45",
  warning: "border-amber-500/40",
  info: "border-sky-500/35",
};

export function LegalRisksCard({ risks }: { risks: LegalRiskCardModel[] }) {
  return (
    <section className="rounded-2xl border border-premium-gold/25 bg-black/40 p-5" aria-labelledby="legal-risks-heading">
      <h2 id="legal-risks-heading" className="text-sm font-semibold text-white">
        Attention items
      </h2>
      <p className="mt-1 text-xs text-[#737373]">Operational signals from your account — not legal conclusions.</p>
      {risks.length === 0 ? (
        <p className="mt-4 text-sm text-[#9CA3AF]">No risk flags from current signals.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {risks.map((r) => (
            <li key={r.id} className={`rounded-xl border bg-[#121212] px-4 py-3 ${BORDER[r.severity]}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">{r.severity}</p>
              <p className="mt-1 text-sm font-medium text-white">{r.title}</p>
              <p className="mt-1 text-xs text-[#B3B3B3]">{r.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
