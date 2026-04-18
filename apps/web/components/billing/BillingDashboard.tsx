"use client";

import { useEffect, useState } from "react";

export function BillingDashboard() {
  const [msg, setMsg] = useState<string>("Loading…");
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/broker/office/billing/invoices", { credentials: "include" });
      const j = (await r.json()) as { error?: string; invoices?: unknown[] };
      if (!r.ok) setMsg(j.error ?? "Could not load invoices (finance role required).");
      else setMsg(`Loaded ${j.invoices?.length ?? 0} invoice(s).`);
    })();
  }, []);
  return <p className="text-sm text-zinc-400">{msg}</p>;
}
