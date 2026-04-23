import React from "react";

export function MandatoryPrivacyWarnings() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 text-sm">
        <p className="font-bold mb-1">⚠️ Secondary Use Warning</p>
        <p>
          Personal information collected for this transaction must not be used for marketing, 
          prospecting, or other secondary purposes without explicit, separate consent from the client.
        </p>
      </div>

      <div className="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 text-sm">
        <p className="font-bold mb-1">ℹ️ Disclosure Notice</p>
        <p>
          Before sharing any document externally (e.g., with a buyer's broker or Centris), 
          ensure that only the minimum necessary information is disclosed and that required redactions are applied.
        </p>
      </div>

      <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-800 text-sm">
        <p className="font-bold mb-1">🛑 Sold Price Handling</p>
        <p>
          The sold price of a property must not be publicly advertised or disclosed to unauthorized parties 
          before it is published in the land register, unless specific client authorization is obtained.
        </p>
      </div>
    </div>
  );
}
