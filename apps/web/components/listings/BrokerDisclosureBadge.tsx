import React from "react";

export function BrokerDisclosureBadge({ 
  brokerName, 
  licenseNumber 
}: { 
  brokerName: string; 
  licenseNumber: string 
}) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
        B
      </span>
      <span>
        Listed by <span className="font-bold">{brokerName}</span> · OACIQ #{licenseNumber}
      </span>
    </div>
  );
}
