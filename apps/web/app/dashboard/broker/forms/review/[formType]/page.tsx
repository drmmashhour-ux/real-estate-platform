"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

export default function BrokerDraftReviewPage() {
  const params = useParams();
  const formType = typeof params?.formType === "string" ? params.formType : "unknown";

  const [checks, setChecks] = useState({
    sourceGroundingConfirmed: false,
    namesConfirmed: false,
    addressesConfirmed: false,
    datesConfirmed: false,
    amountsConfirmed: false,
    clausesConfirmed: false,
    missingFieldsResolved: false,
    finalBrokerReview: false,
  });

  const allChecked = Object.values(checks).every(Boolean);

  function toggle(key: keyof typeof checks) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6 p-6 text-white">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-[#D4AF37]">Broker draft review</h1>
        <p className="mt-1 text-sm text-white/60">
          Form: <span className="text-white/90">{formType}</span> — confirm each item before signature. AI-assisted
          drafts stay blocked until you complete this checklist and the API returns{" "}
          <code className="text-white/80">releaseReady</code>.
        </p>
      </div>

      <div className="space-y-3">
        {(Object.keys(checks) as Array<keyof typeof checks>).map((key) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/30"
              checked={checks[key]}
              onChange={() => toggle(key)}
            />
            <span className="capitalize text-white/90">{key.replace(/([A-Z])/g, " $1").trim()}</span>
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={!allChecked}
        className={`rounded-lg px-4 py-3 font-semibold ${
          allChecked ? "bg-[#D4AF37] text-black" : "cursor-not-allowed bg-white/10 text-white/40"
        }`}
      >
        Continue to signature
      </button>
    </div>
  );
}
