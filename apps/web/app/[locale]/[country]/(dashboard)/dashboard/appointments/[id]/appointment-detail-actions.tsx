"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppointmentStatus } from "@/types/scheduling-client";
import type { PlatformRole } from "@/types/platform-role";

export function AppointmentDetailActions({
  appointmentId,
  status,
  viewerRole,
  isBroker,
  isAdmin,
  isClient,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  viewerRole: PlatformRole;
  isBroker: boolean;
  isAdmin: boolean;
  isClient: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canBroker = isBroker || isAdmin;

  async function call(path: string, body?: Record<string, unknown>) {
    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/appointments/${appointmentId}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: body ? JSON.stringify(body) : undefined,
    });
    setLoading(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Action failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {err ? <p className="text-sm text-red-300">{err}</p> : null}
      <div className="flex flex-wrap gap-2">
        {canBroker && (status === "PENDING" || status === "RESCHEDULE_REQUESTED") ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => call("/confirm")}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Confirm
          </button>
        ) : null}
        {canBroker && status === "CONFIRMED" ? (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => call("/complete")}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Mark complete
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => call("/no-show")}
              className="rounded-lg border border-amber-500/40 px-4 py-2 text-sm text-amber-200 hover:bg-amber-500/10"
            >
              No-show
            </button>
          </>
        ) : null}
        {(canBroker || isClient) && ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED"].includes(status) ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => call("/cancel", { reason: "Cancelled from detail" })}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10"
          >
            Cancel
          </button>
        ) : null}
      </div>
      <p className="text-xs text-slate-600">Role: {viewerRole}</p>
    </div>
  );
}
