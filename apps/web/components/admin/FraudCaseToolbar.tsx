"use client";

import { useState } from "react";
import type { FraudCaseStatus } from "@/types/admin-reputation-client";

export function FraudCaseToolbar({ caseId }: { caseId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/fraud/cases/${caseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Request failed");
      window.location.reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function btn(
    label: string,
    body: Record<string, unknown>,
    variant: "neutral" | "danger" | "ok" = "neutral"
  ) {
    const cls =
      variant === "danger"
        ? "bg-red-900/40 text-red-100 hover:bg-red-900/60"
        : variant === "ok"
          ? "bg-emerald-900/40 text-emerald-100 hover:bg-emerald-900/60"
          : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700";
    return (
      <button
        type="button"
        disabled={busy}
        className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${cls}`}
        onClick={() => void post(body)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <p className="text-sm font-medium text-white">Decisions (reversible)</p>
      <p className="text-xs text-zinc-500">
        Suspend user / hold listing are operational reversals from Users or Listings admin when needed.
      </p>
      <div className="flex flex-wrap gap-2">
        {btn("Mark false positive", { status: "false_positive" as FraudCaseStatus }, "ok")}
        {btn("Confirm fraud", { status: "confirmed_fraud" as FraudCaseStatus }, "danger")}
        {btn("Under review", { status: "under_review" as FraudCaseStatus })}
        {btn("Resolved", { status: "resolved" as FraudCaseStatus })}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
        {btn("Suspend user (account)", { action: "suspend_user" }, "danger")}
        {btn("Hold listing (investigation)", { action: "hold_listing" }, "danger")}
      </div>
      {msg ? <p className="text-sm text-amber-300">{msg}</p> : null}
    </div>
  );
}
