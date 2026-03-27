"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ClientIntakeStatus } from "@prisma/client";

const STATUSES: ClientIntakeStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "UNDER_REVIEW",
  "COMPLETE",
  "ON_HOLD",
];

type Props = {
  brokerClientId: string;
  currentStatus: ClientIntakeStatus;
  templateKeys: readonly string[];
};

export function BrokerIntakeDetailActions({ brokerClientId, currentStatus, templateKeys }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [templateKey, setTemplateKey] = useState(templateKeys[0] ?? "");

  async function applyTemplate() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/intake/templates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ brokerClientId, templateKey }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Apply failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: ClientIntakeStatus) {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/intake/profile/${encodeURIComponent(brokerClientId)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Status update failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 text-xs">
      {err ? <p className="text-rose-400">{err}</p> : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={templateKey}
          onChange={(e) => setTemplateKey(e.target.value)}
          className="rounded border border-white/15 bg-black/40 px-2 py-1 text-slate-200"
        >
          {templateKeys.map((k) => (
            <option key={k} value={k}>
              {k.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() => void applyTemplate()}
          className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 font-medium text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-50"
        >
          Apply template
        </button>
      </div>
      <div className="flex flex-wrap justify-end gap-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy || s === currentStatus}
            onClick={() => void setStatus(s)}
            className={
              s === currentStatus
                ? "rounded-full bg-white/15 px-2 py-1 text-white"
                : "rounded-full border border-white/10 px-2 py-1 text-slate-400 hover:bg-white/5"
            }
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
}
