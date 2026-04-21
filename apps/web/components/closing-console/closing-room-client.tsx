"use client";

import * as React from "react";

/** Secure document-room — same data as workspace; emphasize confidentiality (no edit controls required here). */
export function ClosingRoomClient({ dealId }: { dealId: string }) {
  const [payload, setPayload] = React.useState<unknown>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/closing/deals/${dealId}`, { credentials: "include" });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Forbidden");
        if (!cancelled) setPayload(j);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  if (err) {
    return <p className="text-sm text-red-600">This closing room is not available: {err}</p>;
  }
  if (!payload) return <p className="text-sm text-muted-foreground">Loading secure room…</p>;

  const row = payload as {
    closing?: { status?: string; readinessStatus?: string | null };
    readiness?: { readinessStatus?: string; blockers?: string[] };
    documents?: unknown[];
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong>Confidential.</strong> Closing materials are access-controlled and audit-logged. Do not share raw file URLs
        outside authorized parties.
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-3 text-sm">
          <p className="text-xs text-muted-foreground">Session</p>
          <p className="font-medium">{row.closing?.status ?? "—"}</p>
        </div>
        <div className="rounded-lg border p-3 text-sm">
          <p className="text-xs text-muted-foreground">Readiness</p>
          <p className="font-medium">{row.readiness?.readinessStatus ?? row.closing?.readinessStatus ?? "—"}</p>
        </div>
        <div className="rounded-lg border p-3 text-sm">
          <p className="text-xs text-muted-foreground">Documents</p>
          <p className="font-medium">{Array.isArray(row.documents) ? row.documents.length : 0} rows</p>
        </div>
      </div>
      <pre className="max-h-[480px] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}
