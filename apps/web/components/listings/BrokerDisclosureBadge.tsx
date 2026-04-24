import React from "react";

/**
 * PHASE 3 & 5: BROKER VISIBILITY & LEGAL DISCLOSURE
 * Displays verified broker information and mandatory OACIQ regulatory disclosure.
 */
export function BrokerDisclosureBadge({ 
  brokerName, 
  licenseNumber,
  practiceMode = "INDEPENDENT"
}: { 
  brokerName: string; 
  licenseNumber: string;
  practiceMode?: string;
}) {
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3 h-3"
          >
            <path
              fillRule="evenodd"
              d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-3.946-3.036a.75.75 0 00-1.074-1.05l-3.92 4.01-1.47-1.47a.75.75 0 10-1.06 1.06l2 2a.75.75 0 001.074.012l4.45-4.562z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">
              Licensed Broker Verified
            </span>
            <span className="inline-block px-1 rounded-sm bg-emerald-600 text-[8px] text-white font-bold uppercase tracking-tighter">OACIQ</span>
          </div>
          <span>
            <span className="font-bold">{brokerName}</span> · #{licenseNumber} · {practiceMode === "INDEPENDENT" ? "Independent" : "Agency"}
          </span>
        </div>
      </div>
      <p className="px-1 text-[10px] text-slate-500 italic">
        Services provided by a licensed real estate broker regulated by OACIQ.
      </p>
    </div>
  );
}
