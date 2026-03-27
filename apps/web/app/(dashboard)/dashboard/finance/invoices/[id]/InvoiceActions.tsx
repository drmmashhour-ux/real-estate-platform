"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TenantInvoiceStatus } from "@prisma/client";

export function InvoiceActions(props: { invoiceId: string; status: TenantInvoiceStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function post(path: string) {
    setBusy(true);
    try {
      const res = await fetch(path, { method: "POST", credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(typeof j?.error === "string" ? j.error : "Action failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {props.status === "DRAFT" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => post(`/api/finance/invoices/${props.invoiceId}/issue`)}
          className="rounded bg-emerald-600/80 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          Issue
        </button>
      ) : null}
      {props.status === "ISSUED" || props.status === "PARTIALLY_PAID" || props.status === "OVERDUE" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => post(`/api/finance/invoices/${props.invoiceId}/mark-paid`)}
          className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 disabled:opacity-40"
        >
          Mark paid
        </button>
      ) : null}
      {props.status !== "CANCELLED" && props.status !== "PAID" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => post(`/api/finance/invoices/${props.invoiceId}/cancel`)}
          className="rounded border border-red-500/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-40"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}
