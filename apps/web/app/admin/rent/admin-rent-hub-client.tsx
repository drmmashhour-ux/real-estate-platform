"use client";

import { useEffect, useState } from "react";
import { RentDecisionAiCard } from "@/components/rental/RentDecisionAiCard";

type Payload = {
  listings: unknown[];
  applications: unknown[];
  leases: unknown[];
  payments: unknown[];
};

export function AdminRentHubClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/rental", { credentials: "same-origin" });
        const j = (await r.json()) as Payload & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!data) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  const leaseId =
    Array.isArray(data.leases) && data.leases.length > 0 && typeof data.leases[0] === "object" && data.leases[0] !== null && "id" in data.leases[0]
      ? String((data.leases[0] as { id: string }).id)
      : null;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <RentDecisionAiCard hub="admin" entityType="platform" entityId={null} title="AI Daily Report" />
        {leaseId ? (
          <RentDecisionAiCard
            hub="admin"
            entityType="rental_lease"
            entityId={leaseId}
            title="Lease & payments (AI)"
          />
        ) : null}
      </div>

      <AdminJsonTable title="Listings" rows={data.listings} />
      <AdminJsonTable title="Applications" rows={data.applications} />
      <AdminJsonTable title="Leases" rows={data.leases} />
      <AdminJsonTable title="Payments" rows={data.payments} />
    </div>
  );
}

function AdminJsonTable({ title, rows }: { title: string; rows: unknown[] }) {
  return (
    <div>
      <h2 className="text-lg font-medium text-white">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{rows.length} row(s)</p>
      <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-300">
        {JSON.stringify(rows, null, 2)}
      </pre>
    </div>
  );
}
