"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type TenantOption = {
  tenantId: string;
  name: string;
  slug: string;
  role: string;
};

export function TenantSwitcher(props: {
  tenants: TenantOption[];
  currentTenantId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(tenantId: string) {
    if (!tenantId || tenantId === props.currentTenantId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tenants/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(typeof j?.error === "string" ? j.error : "Could not switch workspace");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (props.tenants.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No workspaces yet. Create one below to get started.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Workspace</label>
      <select
        className="w-full max-w-md rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100"
        value={props.currentTenantId ?? ""}
        disabled={busy}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select workspace…</option>
        {props.tenants.map((t) => (
          <option key={t.tenantId} value={t.tenantId}>
            {t.name} ({t.slug}) — {t.role}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <p className="text-xs text-slate-500">
        Switching workspace refreshes tenant-scoped data across the app.
      </p>
    </div>
  );
}
