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
 * PHASE 4 & 7: AMF PRIVATE INVESTMENT DISCLOSURE
 * Component to ensure investors accept risks and understand the private nature of the deal.
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
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-4">
      <div className="flex items-center gap-2 text-amber-800 font-semibold">
        <span className="text-xl">⚠️</span>
        <h3>Private Investment Disclosure</h3>
      </div>
      
      <p className="text-sm text-amber-900 font-medium italic">
        "Private investment opportunity (not a regulated fund)"
      </p>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            checked={checks.riskAccepted}
            onChange={(e) => setChecks({ ...checks, riskAccepted: e.target.checked })}
          />
          <span className="text-xs text-amber-800 group-hover:text-amber-950 transition-colors">
            I understand that this is a high-risk private investment and I could lose my entire capital.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            checked={checks.notFinancialAdvice}
            onChange={(e) => setChecks({ ...checks, notFinancialAdvice: e.target.checked })}
          />
          <span className="text-xs text-amber-800 group-hover:text-amber-950 transition-colors">
            I acknowledge that LECIPM and the Broker are not providing financial or investment advice.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            checked={checks.independentDecision}
            onChange={(e) => setChecks({ ...checks, independentDecision: e.target.checked })}
          />
          <span className="text-xs text-amber-800 group-hover:text-amber-950 transition-colors">
            I am making this investment decision independently based on my own due diligence.
          </span>
        </label>
      </div>

      <button
        type="button"
        disabled={!allChecked || isLoading}
        onClick={() => onAccept(checks)}
        className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? "Processing..." : "Commit Funds (Private Placement)"}
      </button>

      <p className="text-[10px] text-amber-700/70 text-center">
        By clicking, you confirm that you are part of a private network invited to this opportunity.
      </p>
    </div>
  );
}
