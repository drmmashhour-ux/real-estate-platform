"use client";

import { useEffect, useState } from "react";

type StatusPayload = {
  executionReadinessStatus: string;
  officialBrokerAuthorizedProvider: string;
  message: string;
  specimenDisclaimer: string;
};

export function OfficialExecutionStatusCard({ dealId }: { dealId: string }) {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}/execution-bridge/status`, { credentials: "include" });
        const j = (await res.json()) as StatusPayload & { error?: string };
        if (res.status === 403) {
          setErr("Execution bridge API disabled — set FEATURE_OACIQ_EXECUTION_BRIDGE_V1 when ready to audit exports.");
          return;
        }
        if (!res.ok) throw new Error(j.error ?? "Failed");
        setData(j);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
      }
    })();
  }, [dealId]);

  if (err) {
    return <p className="text-xs text-ds-text-secondary">{err}</p>;
  }
  if (!data) {
    return <p className="text-xs text-ds-text-secondary">Loading execution bridge status…</p>;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
      <h4 className="font-medium text-ds-text">Official execution bridge</h4>
      <p className="mt-2 text-xs text-ds-text-secondary">{data.message}</p>
      <p className="mt-2 font-mono text-[11px] text-ds-gold/80">
        readiness={data.executionReadinessStatus} · provider={data.officialBrokerAuthorizedProvider}
      </p>
      <p className="mt-2 text-[11px] text-ds-text-secondary">{data.specimenDisclaimer}</p>
    </div>
  );
}
