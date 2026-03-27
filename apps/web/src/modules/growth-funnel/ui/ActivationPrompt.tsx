"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Shown after first-value completion: nudges save scenario + next product steps.
 */
export function ActivationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const sync = () => {
      setShow(window.localStorage.getItem("lecipm_first_value_done") === "1");
    };
    sync();
    window.addEventListener("lecipm-activation", sync);
    return () => window.removeEventListener("lecipm-activation", sync);
  }, []);

  if (!show) return null;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm text-emerald-100">
      <p className="font-medium text-white">Next: lock in your work</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-emerald-200/90">
        <li>Save this scenario from the offer strategy workspace.</li>
        <li>Open your dashboard to continue the deal timeline.</li>
        <li>Invite a collaborator when you are ready (referrals unlock bonus capacity).</li>
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/dashboard" className="text-sm font-medium text-emerald-300 underline-offset-2 hover:underline">
          Continue your deal
        </Link>
      </div>
    </div>
  );
}
