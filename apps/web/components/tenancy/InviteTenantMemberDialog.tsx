"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TenantRole } from "@/types/tenancy-finance-enums-client";
import { TENANT_ROLE_LABELS } from "@/modules/tenancy/constants";

const ROLES: TenantRole[] = [
  "TENANT_ADMIN",
  "BROKER",
  "ASSISTANT",
  "STAFF",
  "VIEWER",
];

export function InviteTenantMemberDialog(props: { tenantId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<TenantRole>("BROKER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${props.tenantId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), role }),
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.error === "string" ? j.error : "Invite failed");
        return;
      }
      setUserId("");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded bg-emerald-600/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Add member
      </button>
      {open ? (
        <div className="mt-4 space-y-3 rounded border border-white/10 bg-black/50 p-4">
          <p className="text-xs text-slate-400">
            Enter an existing platform user id (email invite flow can extend this). Team members appear as invited until activated.
          </p>
          <input
            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
            placeholder="User id"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <select
            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as TenantRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {TENANT_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !userId.trim()}
              onClick={() => submit()}
              className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 disabled:opacity-40"
            >
              Save
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-200">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
