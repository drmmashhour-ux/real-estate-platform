"use client";

import * as React from "react";

type ExecutionStatusPayload = {
  brokerApprovalLabel?: string;
  brokerApprovalUiState?: string;
  error?: string;
};

export function BrokerApprovalStatusChip(props: { dealId: string }) {
  const { dealId } = props;
  const [label, setLabel] = React.useState<string | null>(null);
  const [state, setState] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}/execution-status`, { credentials: "include" });
        const data = (await res.json()) as ExecutionStatusPayload;
        if (cancelled) return;
        if (!res.ok) {
          setLabel(null);
          setState(null);
          return;
        }
        setLabel(typeof data.brokerApprovalLabel === "string" ? data.brokerApprovalLabel : null);
        setState(typeof data.brokerApprovalUiState === "string" ? data.brokerApprovalUiState : null);
      } catch {
        if (!cancelled) {
          setLabel(null);
          setState(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  if (!label) return null;

  const cls =
    state === "approved_signed" ? "border-emerald-500/50 bg-emerald-950/50 text-emerald-100"
    : state === "rejected" ? "border-rose-500/50 bg-rose-950/50 text-rose-100"
    : state === "legacy_approved" ? "border-amber-500/40 bg-amber-950/35 text-amber-100"
    : "border-zinc-600 bg-zinc-900 text-zinc-200";

  return (
    <div
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${cls}`}
      role="status"
    >
      {label}
    </div>
  );
}
