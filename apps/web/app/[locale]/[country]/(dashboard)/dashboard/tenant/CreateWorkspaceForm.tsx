"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.error === "string" ? j.error : "Could not create workspace");
        return;
      }
      setName("");
      const tenantId = j?.tenant?.id as string | undefined;
      if (tenantId) {
        await fetch("/api/tenants/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId }),
          credentials: "include",
        });
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label className="text-xs text-slate-500">Workspace name</label>
        <input
          className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. North Shore Realty"
          required
        />
      </div>
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="rounded bg-emerald-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
      >
        Create
      </button>
      {error ? <p className="w-full text-sm text-red-400">{error}</p> : null}
    </form>
  );
}
