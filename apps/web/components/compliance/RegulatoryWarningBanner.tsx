import React from "react";

interface RegulatoryWarningBannerProps {
  warning?: string;
  className?: string;
}

/**
 * PHASE 6: REGULATORY WARNINGS
 * Displays high-visibility compliance warnings for OACIQ/AMF boundaries.
 */
export function RegulatoryWarningBanner({ warning, className }: RegulatoryWarningBannerProps) {
  if (!warning) return null;

  return (
    <div className={`flex items-center gap-3 rounded-lg border-2 border-rose-500 bg-rose-50 p-4 text-rose-900 ${className}`}>
      <span className="text-2xl" role="img" aria-label="Regulatory Blocked">
        🚫
      </span>
      <div>
        <p className="text-sm font-bold uppercase tracking-tight">Regulatory Compliance Alert</p>
        <p className="text-xs font-medium leading-relaxed">{warning}</p>
      </div>
    </div>
  );
}

/**
 * Hook-like component for quick check display
 */
export function AmfRegistrationRequiredWarning() {
  return (
    <RegulatoryWarningBanner 
      warning="This action requires AMF registration. Platform is currently in Private / Simulation mode." 
    />
  );
}

export function OaciqBrokerRequiredWarning() {
  return (
    <RegulatoryWarningBanner 
      warning="Brokerage action must be performed by a licensed real estate broker." 
    />
  );
}
