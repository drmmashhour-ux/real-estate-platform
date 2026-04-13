"use client";

import { useState } from "react";

export function CopyReferralButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white"
    >
      {copied ? "Copied" : "Copy referral link"}
    </button>
  );
}
