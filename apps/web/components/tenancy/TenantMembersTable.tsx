"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TENANT_ROLE_LABELS } from "@/modules/tenancy/constants";
import type { TenantRole, TenantMembershipStatus } from "@/types/tenancy-finance-enums-client";

export type MemberRow = {
  id: string;
  role: TenantRole;
  status: TenantMembershipStatus;
  email: string | null;
  name: string | null;
};

export function TenantMembersTable(props: {
  tenantId: string;
  members: MemberRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patchMembership(membershipId: string, body: Record<string, unknown>) {
    setBusyId(membershipId);
    try {
      const res = await fetch(`/api/tenants/${props.tenantId}/members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(typeof j?.error === "string" ? j.error : "Update failed");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded border border-white/10">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="bg-white/5 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Member</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Status</th>
            {props.canManage ? <th className="px-3 py-2">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {props.members.map((m) => (
            <tr key={m.id} className="border-t border-white/5">
              <td className="px-3 py-2">
                <div className="font-medium">{m.name ?? "—"}</div>
                <div className="text-xs text-slate-500">{m.email}</div>
              </td>
              <td className="px-3 py-2">{TENANT_ROLE_LABELS[m.role]}</td>
              <td className="px-3 py-2">{m.status}</td>
              {props.canManage ? (
                <td className="px-3 py-2 space-x-2">
                  <button
                    type="button"
                    className="text-xs text-emerald-400 hover:underline disabled:opacity-40"
                    disabled={busyId === m.id}
                    onClick={() => patchMembership(m.id, { status: "ACTIVE" })}
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    className="text-xs text-amber-400 hover:underline disabled:opacity-40"
                    disabled={busyId === m.id}
                    onClick={() => patchMembership(m.id, { status: "SUSPENDED" })}
                  >
                    Suspend
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
