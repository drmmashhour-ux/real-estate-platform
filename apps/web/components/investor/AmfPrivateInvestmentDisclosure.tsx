import React, { useState } from "react";

interface AmfPrivateInvestmentDisclosureProps {
  onAccept: (data: {
    riskAccepted: boolean;
    notFinancialAdvice: boolean;
    independentDecision: boolean;
  }) => void;
  isLoading?: boolean;
}

/**
 * PART 11: UI DISCLOSURE SYSTEM
 * Upgraded to align with Québec Regulatory Alignment Layer (AMF + OACIQ).
 */
export function AmfPrivateInvestmentDisclosure({ 
  onAccept, 
  isLoading 
}: AmfPrivateInvestmentDisclosureProps) {
  const [checks, setChecks] = useState({
    riskAccepted: false,
    notFinancialAdvice: false,
    independentDecision: false,
  });

  const allChecked = checks.riskAccepted && checks.notFinancialAdvice && checks.independentDecision;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">AMF</span>
          <h3>Regulatory Disclosure</h3>
        </div>
        <div className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider border border-blue-200">
          Simulation Mode
        </div>
      </div>
      
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-900 font-bold flex items-center gap-1.5">
          <span className="text-sm">⚠️</span>
          NOT FINANCIAL ADVICE
        </p>
        <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
          Information provided on this platform does not constitute financial, investment, or legal advice. 
          All investment activities are currently in <strong>SIMULATION MODE</strong> for educational purposes only.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            checked={checks.riskAccepted}
            onChange={(e) => setChecks({ ...checks, riskAccepted: e.target.checked })}
          />
          <span className="text-xs text-slate-700 group-hover:text-slate-950 transition-colors">
            I understand that any "returns" shown are simulated and do not represent actual financial performance.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            checked={checks.notFinancialAdvice}
            onChange={(e) => setChecks({ ...checks, notFinancialAdvice: e.target.checked })}
          />
          <span className="text-xs text-slate-700 group-hover:text-slate-950 transition-colors">
            I acknowledge that <strong>LECIPM Capital Inc.</strong> is not providing financial advice and this is not an AMF-regulated offering.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            checked={checks.independentDecision}
            onChange={(e) => setChecks({ ...checks, independentDecision: e.target.checked })}
          />
          <span className="text-xs text-slate-700 group-hover:text-slate-950 transition-colors">
            I am performing my own due diligence and do not rely on AI outputs for financial decisions.
          </span>
        </label>
      </div>

      <button
        type="button"
        disabled={!allChecked || isLoading}
        onClick={() => onAccept(checks)}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? "Processing..." : "Confirm Simulation Commitment"}
      </button>

      <p className="text-[10px] text-slate-500 text-center">
        Services provided under SIMULATION mode. No real capital will be moved.
      </p>
    </div>
  );
}
