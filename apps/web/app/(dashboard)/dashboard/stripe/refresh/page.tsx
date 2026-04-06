"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Stripe Connect refresh_url — issues a fresh Account Link and sends the user back to Stripe.
 */
export default function DashboardStripeRefreshPage() {
  const [message, setMessage] = useState("Refreshing your Stripe setup link…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stripe/connect/create-account-link", {
          method: "POST",
          credentials: "same-origin",
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (cancelled) return;
        if (res.ok && data.url) {
          window.location.href = data.url;
          return;
        }
        setMessage(data.error ?? "Could not open a new setup link. Return to payouts and try again.");
      } catch {
        if (!cancelled) setMessage("Network error. Return to payouts and try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center text-slate-200">
      <p className="text-sm">{message}</p>
      <Link href="/dashboard/host/payouts" className="mt-6 inline-block text-sm text-emerald-400 hover:text-emerald-300">
        ← Back to payouts
      </Link>
    </div>
  );
}
