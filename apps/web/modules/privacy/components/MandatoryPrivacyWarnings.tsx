import React from "react";

export function MandatoryPrivacyWarnings() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-orange-50 border-l-4 border-orange-400 text-orange-800 text-xs">
        <p className="font-bold mb-1 uppercase tracking-tight">Warning: Secondary Use of Data</p>
        <p>Using client personal information for marketing, commercial prospecting, or non-transactional purposes requires 
           <strong> specific, explicit, and revocable consent</strong> under Québec Law 25. 
           Failure to obtain consent before use may lead to administrative penalties.</p>
      </div>

      <div className="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 text-xs">
        <p className="font-bold mb-1 uppercase tracking-tight">OACIQ Rule: Sold Price Publication</p>
        <p>The sold price of a property must not be advertised or disclosed to the public before it has been published 
           in the Land Register. Disclosure to license holders is permitted only under strict client authorization 
           and within authorized dissemination systems.</p>
      </div>

      <div className="p-4 bg-gray-50 border-l-4 border-gray-400 text-gray-800 text-xs">
        <p className="font-bold mb-1 uppercase tracking-tight">Redaction Requirement</p>
        <p>Before sharing any brokerage file document with third parties (unrepresented buyers, other agencies), 
           ensure that all identifying personal information not strictly necessary for the purpose of disclosure 
           (ID numbers, DOB, signatures) has been redacted from the copy.</p>
      </div>
    </div>
  );
}
