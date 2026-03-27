import { analyzeDealDeterministic } from "@/lib/investor/deal-analyzer";
import {
  closingCostRoughEstimate,
  mortgagePaymentMonthly,
  welcomeTaxEstimate,
} from "@/lib/finance/qc-estimates";

export default function InvestorPage() {
  const sample = analyzeDealDeterministic({
    purchasePrice: 850_000,
    monthlyRent: 3200,
    annualExpenses: 14_000,
    vacancyRatePct: 5,
  });
  const wt = welcomeTaxEstimate(850_000);
  const closing = closingCostRoughEstimate(850_000);
  const mortgage = mortgagePaymentMonthly(680_000, 5.5, 25);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-light text-white">Investor tools</h1>
        <p className="mt-2 text-xs text-emerald-200/50">
          All figures are estimates — not tax or financial advice.
        </p>
      </div>
      <section className="rounded-2xl border border-emerald-900/50 bg-[#0c1a14] p-5">
        <h2 className="text-sm font-semibold text-[#d4af37]">Sample deal (deterministic)</h2>
        <ul className="mt-3 space-y-1 text-sm text-emerald-100/80">
          <li>NOI (illustrative): {sample.noi.toFixed(0)}</li>
          <li>Cap rate: {sample.capRatePct.toFixed(2)}%</li>
          <li>Verdict: {sample.verdict}</li>
        </ul>
      </section>
      <section className="rounded-2xl border border-emerald-900/50 bg-[#0c1a14] p-5">
        <h2 className="text-sm font-semibold text-[#d4af37]">QC welcome tax (rough)</h2>
        <p className="mt-2 text-sm text-emerald-100/80">
          On $850k purchase: ~${wt.toLocaleString(undefined, { maximumFractionDigits: 0 })} CAD
          (illustrative tiered model — not an official assessment).
        </p>
      </section>
      <section className="rounded-2xl border border-emerald-900/50 bg-[#0c1a14] p-5">
        <h2 className="text-sm font-semibold text-[#d4af37]">Closing + mortgage helpers</h2>
        <p className="mt-2 text-sm text-emerald-100/80">
          Rough closing placeholder: ${closing.toFixed(0)} · Sample mortgage payment (25y @ 5.5% on
          $680k principal): ${mortgage.toFixed(0)}/mo
        </p>
      </section>
    </div>
  );
}
