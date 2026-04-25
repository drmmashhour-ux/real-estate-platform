"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteBrokerClientButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onDelete() {
    if (!window.confirm("Delete this client and all CRM data?")) return;
    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/broker/clients/${clientId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    setLoading(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Could not delete");
      return;
    }
    router.push("/dashboard/broker/clients");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={onDelete}
        className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50"
      >
        {loading ? "Deleting…" : "Delete client"}
      </button>
      {err ? <p className="mt-2 text-sm text-red-300">{err}</p> : null}
    </div>
  );
}
