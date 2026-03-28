"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionBody = {
  action: "send_message" | "assign_broker" | "push_booking" | "mark_hot" | "mark_lost";
  leadId: string;
  brokerUserId?: string;
  note?: string;
  reason?: string;
};

export function CrmLiveQuickActions({
  leadId,
  compact,
}: {
  leadId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [brokerId, setBrokerId] = useState("");

  async function run(action: ActionBody["action"], extra?: Record<string, string>) {
    setPending(action);
    try {
      const res = await fetch("/api/admin/crm-execution/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, leadId, ...extra }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert((j as { error?: string }).error ?? "Request failed");
        return;
      }
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  const btn =
    "rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-40";

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        <button type="button" className={btn} disabled={!!pending} onClick={() => run("mark_hot")}>
          Hot
        </button>
        <button type="button" className={btn} disabled={!!pending} onClick={() => run("push_booking")}>
          Push book
        </button>
        <button type="button" className={btn} disabled={!!pending} onClick={() => run("send_message")}>
          Log msg
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={!!pending} onClick={() => run("send_message")}>
          {pending === "send_message" ? "…" : "Message (log)"}
        </button>
        <button type="button" className={btn} disabled={!!pending} onClick={() => run("push_booking")}>
          {pending === "push_booking" ? "…" : "Push booking"}
        </button>
        <button type="button" className={btn} disabled={!!pending} onClick={() => run("mark_hot")}>
          {pending === "mark_hot" ? "…" : "Mark hot"}
        </button>
        <button type="button" className={btn} disabled={!!pending} onClick={() => run("mark_lost", { reason: "admin_crm_live" })}>
          {pending === "mark_lost" ? "…" : "Mark lost"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={brokerId}
          onChange={(e) => setBrokerId(e.target.value)}
          placeholder="Broker user ID"
          className="min-w-[12rem] rounded border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
        />
        <button
          type="button"
          className={btn}
          disabled={!!pending || !brokerId.trim()}
          onClick={() => run("assign_broker", { brokerUserId: brokerId.trim() })}
        >
          {pending === "assign_broker" ? "…" : "Assign broker"}
        </button>
      </div>
      <p className="text-[10px] text-slate-500">
        Deep links:{" "}
        <a className="text-amber-200/90 underline" href={`/dashboard/leads/${leadId}`}>
          broker CRM
        </a>
      </p>
    </div>
  );
}
