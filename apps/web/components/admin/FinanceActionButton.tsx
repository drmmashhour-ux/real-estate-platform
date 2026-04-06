"use client";

import { useState } from "react";

type Props = {
  endpoint: string;
  method?: "POST" | "PATCH";
  body?: Record<string, unknown>;
  label: string;
  busyLabel?: string;
  className?: string;
  confirmMessage?: string;
};

export function FinanceActionButton({
  endpoint,
  method = "POST",
  body,
  label,
  busyLabel,
  className,
  confirmMessage,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        window.alert(data.error ?? "Action failed");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      className={className ?? "text-premium-gold hover:underline disabled:opacity-50"}
    >
      {busy ? busyLabel ?? "Working..." : label}
    </button>
  );
}
