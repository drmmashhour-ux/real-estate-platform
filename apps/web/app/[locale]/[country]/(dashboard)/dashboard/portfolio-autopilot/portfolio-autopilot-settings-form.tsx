"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "off" | "assist" | "safe_autopilot" | "approval_required";

export function PortfolioAutopilotSettingsForm({
  initial,
}: {
  initial: {
    mode: Mode;
    autoRunListingOptimization: boolean;
    autoGenerateContentForTopListings: boolean;
    autoFlagWeakListings: boolean;
    allowPriceRecommendations: boolean;
  };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio-autopilot/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Save failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Portfolio autopilot settings</h2>
      <p className="mt-1 text-sm text-slate-600">
        Controls group-level analysis and safe downstream listing optimization runs. Pricing suggestions remain
        approval-only at the listing layer.
      </p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 space-y-3 text-sm">
        <label className="block">
          <span className="font-medium text-slate-800">Mode</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            defaultValue={initial.mode}
            disabled={pending}
            onChange={(e) => patch({ mode: e.target.value })}
          >
            <option value="off">Off</option>
            <option value="assist">Assist — suggest actions only</option>
            <option value="safe_autopilot">Safe autopilot — run safe listing optimizations</option>
            <option value="approval_required">Approval required — queue actions for review</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            defaultChecked={initial.autoRunListingOptimization}
            disabled={pending}
            onChange={(e) => patch({ autoRunListingOptimization: e.target.checked })}
          />
          Auto-run listing optimization for weak/opportunity stays
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            defaultChecked={initial.autoGenerateContentForTopListings}
            disabled={pending}
            onChange={(e) => patch({ autoGenerateContentForTopListings: e.target.checked })}
          />
          Generate content passes for top performers
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            defaultChecked={initial.autoFlagWeakListings}
            disabled={pending}
            onChange={(e) => patch({ autoFlagWeakListings: e.target.checked })}
          />
          Flag weak listings for optimization
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            defaultChecked={initial.allowPriceRecommendations}
            disabled={pending}
            onChange={(e) => patch({ allowPriceRecommendations: e.target.checked })}
          />
          Allow pricing review runs (suggestions only — never auto-apply live price)
        </label>
      </div>
    </section>
  );
}
