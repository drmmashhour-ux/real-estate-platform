"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InvestorAddLeadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string) || "";
    const email = (fd.get("email") as string) || "";
    try {
      const res = await fetch("/api/investor/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || null, email: email || null, status: "new" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErr(data.error ?? "Failed to add");
        return;
      }
      e.currentTarget.reset();
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <h2 className="text-sm font-semibold text-zinc-200">Add lead</h2>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block text-xs text-zinc-500">
          Name
          <input
            name="name"
            className="mt-1 block w-48 rounded-md border border-zinc-700 bg-black px-2 py-1.5 text-sm text-zinc-100"
            placeholder="Jane Doe"
          />
        </label>
        <label className="block text-xs text-zinc-500">
          Email
          <input
            name="email"
            type="email"
            className="mt-1 block w-56 rounded-md border border-zinc-700 bg-black px-2 py-1.5 text-sm text-zinc-100"
            placeholder="jane@fund.com"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add"}
        </button>
        {err ? <span className="text-xs text-rose-300">{err}</span> : null}
      </form>
    </section>
  );
}
