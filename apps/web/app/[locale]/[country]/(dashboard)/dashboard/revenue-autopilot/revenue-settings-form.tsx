"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "off" | "assist" | "safe_autopilot" | "approval_required";

export function RevenueAutopilotSettingsForm({
  initial,
}: {
  initial: {
    mode: Mode;
    autoPromoteTopListings: boolean;
    autoGenerateRevenueActions: boolean;
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
      const res = await fetch("/api/revenue-autopilot/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopeType: "owner", ...body }),
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
      <h2 className="text-lg font-semibold text-slate-900">Revenue autopilot settings</h2>
      <p className="mt-1 text-sm text-slate-600">
        Safe mode may trigger listing optimization and portfolio alignment — never live price changes or fee edits from
        this layer.
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
            <option value="assist">Assist</option>
            <option value="safe_autopilot">Safe autopilot</option>
            <option value="approval_required">Approval required</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            defaultChecked={initial.autoPromoteTopListings}
            disabled={pending}
            onChange={(e) => patch({ autoPromoteTopListings: e.target.checked })}
          />
          Auto-promote top earners (listing optimization runs)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            defaultChecked={initial.autoGenerateRevenueActions}
            disabled={pending}
            onChange={(e) => patch({ autoGenerateRevenueActions: e.target.checked })}
          />
          Auto-generate revenue actions & safe listing runs
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            defaultChecked={initial.allowPriceRecommendations}
            disabled={pending}
            onChange={(e) => patch({ allowPriceRecommendations: e.target.checked })}
          />
          Allow price review suggestions (approval-only at listing layer)
        </label>
      </div>
    </section>
  );
}
