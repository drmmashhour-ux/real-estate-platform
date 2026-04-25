import {
  ESIGNATURE_BROKER_APPROVAL_LINE,
  ESIGNATURE_EVIDENCE_DISCLAIMER,
  ESIGNATURE_NOTARY_DISCLAIMER,
} from "@/lib/esignature/legal-disclaimers";

export function LecipmEsignatureDisclaimer() {
  return (
    <div className="space-y-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
      <p className="font-semibold uppercase tracking-wide text-amber-400">Québec — e-sign & notarial formalities</p>
      <p>{ESIGNATURE_NOTARY_DISCLAIMER}</p>
      <p>{ESIGNATURE_EVIDENCE_DISCLAIMER}</p>
      <p>{ESIGNATURE_BROKER_APPROVAL_LINE}</p>
    </div>
  );
}
