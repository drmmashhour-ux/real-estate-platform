"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewDealRoomForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create(source: "manual" | "lead" | "thread" | "visit", payload: Record<string, string>) {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/deal-rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, ...payload }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Failed");
      return;
    }
    setOpen(false);
    router.push(`/dashboard/deal-rooms/${data.dealRoom.id}`);
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-200">Create deal room</h2>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-amber-500/40 px-3 py-1 text-xs text-amber-200"
        >
          {open ? "Close" : "Open"}
        </button>
      </div>
      {open ? (
        <div className="mt-4 space-y-4 text-sm">
          {err ? <p className="text-xs text-red-300">{err}</p> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs text-slate-400">
              From lead ID
              <input
                id="leadId"
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                placeholder="crm lead id"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const el = document.getElementById("leadId") as HTMLInputElement | null;
                const leadId = el?.value?.trim();
                if (!leadId) {
                  setErr("Enter lead id");
                  return;
                }
                void create("lead", { leadId });
              }}
              className="self-end rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs text-amber-100"
            >
              Create from lead
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="block text-xs text-slate-400 sm:col-span-2">
              From message thread (Conversation or CRM id)
              <input
                id="threadId"
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                placeholder="thread id"
              />
            </label>
            <label className="block text-xs text-slate-400">
              Source
              <select id="threadSource" className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white">
                <option value="platform">Platform conversation</option>
                <option value="crm">CRM conversation</option>
              </select>
            </label>
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-100 sm:col-span-3"
              onClick={() => {
                const threadId = (document.getElementById("threadId") as HTMLInputElement)?.value?.trim();
                const threadSource =
                  (document.getElementById("threadSource") as HTMLSelectElement)?.value === "crm" ? "crm" : "platform";
                if (!threadId) {
                  setErr("Enter thread id");
                  return;
                }
                void create("thread", { threadId, threadSource });
              }}
            >
              Create from thread
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs text-slate-400">
              From visit request ID
              <input
                id="visitReq"
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const visitRequestId = (document.getElementById("visitReq") as HTMLInputElement)?.value?.trim();
                if (!visitRequestId) {
                  setErr("Enter visit request id");
                  return;
                }
                void create("visit", { visitRequestId });
              }}
              className="self-end rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-100"
            >
              Create from visit
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Manual empty room: use API <code className="text-slate-400">POST /api/deal-rooms</code> with{" "}
            <code className="text-slate-400">listingId</code> / <code className="text-slate-400">leadId</code> fields.
          </p>
        </div>
      ) : null}
    </section>
  );
}
