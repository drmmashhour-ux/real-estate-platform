"use client";

import { useEffect, useState } from "react";

export function PayoutDashboard() {
  const [msg, setMsg] = useState<string>("Loading…");
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/broker/office/payouts", { credentials: "include" });
      const j = (await r.json()) as { error?: string; payouts?: unknown[] };
      if (!r.ok) setMsg(j.error ?? "Could not load payouts (finance role required).");
      else setMsg(`Loaded ${j.payouts?.length ?? 0} payout(s).`);
    })();
  }, []);
  return <p className="text-sm text-zinc-400">{msg}</p>;
}
