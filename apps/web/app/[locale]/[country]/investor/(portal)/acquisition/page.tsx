import { AcquisitionSimulatorClient } from "@/components/investor/AcquisitionSimulatorClient";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default function InvestorPortalAcquisitionPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
          BNHub acquisition · deterministic
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Underwriting simulator</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Model a potential stay property with <strong className="text-slate-300">your assumptions</strong> only. Outputs are a
          static arithmetic proxy (ADR × occupancy × 30 nights, annualized costs). Scenario rows apply fixed deltas — useful for
          stress-testing, not a market appraisal or promise of profit.
        </p>
      </div>

      <AcquisitionSimulatorClient variant="portal" />
    </div>
  );
}
