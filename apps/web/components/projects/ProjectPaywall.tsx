"use client";

import { useState } from "react";

type ProjectPaywallProps = {
  projectId: string;
  projectName: string;
  onSubscribe?: () => void;
};

export function ProjectPaywall({ projectId, projectName, onSubscribe }: ProjectPaywallProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [payPerLeadLoading, setPayPerLeadLoading] = useState(false);

  const startCheckout = async (type: string) => {
    setLoading(type);
    try {
      const res = await fetch(`/api/projects/${projectId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data?.error ?? "Checkout failed");
    } finally {
      setLoading(null);
    }
  };

  const switchToPayPerLead = async () => {
    setPayPerLeadLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pay_per_lead" }),
        credentials: "same-origin",
      });
      if (res.ok) {
        onSubscribe?.();
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Failed to switch plan");
      }
    } finally {
      setPayPerLeadLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
      <h3 className="text-xl font-semibold text-amber-200">
        This project trial expired
      </h3>
      <p className="mt-2 text-slate-300">
        Choose a plan to continue receiving leads for <strong>{projectName}</strong>.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => startCheckout("subscription")}
          disabled={!!loading}
          className="rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-teal-400 disabled:opacity-50"
        >
          {loading === "subscription" ? "Redirecting…" : "Subscribe ($49/mo)"}
        </button>
        <button
          type="button"
          onClick={switchToPayPerLead}
          disabled={payPerLeadLoading}
          className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 disabled:opacity-50"
        >
          {payPerLeadLoading ? "Updating…" : "Pay per lead"}
        </button>
        <button
          type="button"
          onClick={() => startCheckout("premium")}
          disabled={!!loading}
          className="rounded-xl border border-teal-400 bg-teal-500/20 px-6 py-3 text-sm font-semibold text-teal-300 transition-all hover:bg-teal-500/30 disabled:opacity-50"
        >
          {loading === "premium" ? "Redirecting…" : "Upgrade premium ($199)"}
        </button>
      </div>
    </div>
  );
}
