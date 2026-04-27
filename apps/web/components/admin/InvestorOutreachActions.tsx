"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  /** Lead id in DB */
  leadId: string;
};

/**
 * Fire-and-refresh: POSTs to admin API; no secrets in the client.
 */
export function SendInvestorMessageButton({ leadId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSend() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/investor/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorId: leadId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setErr(data.error ?? "Request failed");
        return;
      }
      await navigator.clipboard.writeText(data.message ?? "").catch(() => {});
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void onSend()}
        disabled={busy}
        className="rounded-lg border border-[#D4AF37]/50 bg-amber-950/30 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-900/30 disabled:opacity-50"
      >
        {busy ? "Working…" : "Send message"}
      </button>
      {err ? <span className="text-xs text-rose-300">{err}</span> : null}
    </div>
  );
}

const STATUSES = ["new", "contacted", "replied", "meeting", "closed"] as const;

export function InvestorStatusSelect({ leadId, value }: { leadId: string; value: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onChange(next: string) {
    if (next === value) return;
    setBusy(true);
    try {
      await fetch("/api/investor/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorId: leadId, status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => void onChange(e.target.value)}
      className="w-full min-w-[9rem] rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function LogInvestorReplyButton({ leadId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLog() {
    setBusy(true);
    try {
      await fetch("/api/investor/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorId: leadId }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onLog()}
      disabled={busy}
      className="text-xs text-zinc-400 underline hover:text-zinc-200 disabled:opacity-50"
    >
      {busy ? "…" : "Log reply"}
    </button>
  );
}
