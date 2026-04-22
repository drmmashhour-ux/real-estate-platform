"use client";

import { useState } from "react";

export default function FormReviewPage() {
  const [checks, setChecks] = useState({
    factsConfirmed: false,
    datesConfirmed: false,
    namesConfirmed: false,
    legalClausesConfirmed: false,
    missingFieldsChecked: false,
    finalApproval: false,
  });

  const allChecked = Object.values(checks).every(Boolean);

  function toggle(key: keyof typeof checks) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-[#D4AF37]">Broker Review Checklist</h1>

      <div className="space-y-3 text-white">
        {Object.keys(checks).map((key) => (
          <label key={key} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={checks[key as keyof typeof checks]}
              onChange={() => toggle(key as keyof typeof checks)}
            />
            <span>{key}</span>
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={!allChecked}
        className={`px-4 py-3 font-semibold ${
          allChecked ? "bg-[#D4AF37] text-black" : "bg-gray-700 text-gray-300"
        }`}
      >
        Continue to Signature
      </button>
    </div>
  );
}
