"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionRow = {
  id: string;
  actionType: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  estimatedUpliftCents: number | null;
};

export function RevenueRunClient({ basePath, actions }: { basePath: string; actions: ActionRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy("run");
    setMsg(null);
    try {
      const res = await fetch("/api/revenue-autopilot/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopeType: "owner" }),
        credentials: "same-origin",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; actionsCreated?: number };
      if (!res.ok) throw new Error(j.error ?? "Run failed");
      setMsg(`Analysis complete — ${j.actionsCreated ?? 0} action(s).`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(null);
    }
  }

  async function applySafe() {
    setBusy("apply");
    setMsg(null);
    try {
      const res = await fetch("/api/revenue-autopilot/apply-safe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopeType: "owner" }),
        credentials: "same-origin",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; processed?: number };
      if (!res.ok) throw new Error(j.error ?? "Apply failed");
      setMsg(`Processed ${j.processed ?? 0} safe action(s).`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Apply failed");
    } finally {
      setBusy(null);
    }
  }

  async function approve(id: string) {
    setBusy(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/revenue-autopilot/actions/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopeType: "owner" }),
        credentials: "same-origin",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Approve failed");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    setBusy(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/revenue-autopilot/actions/${encodeURIComponent(id)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopeType: "owner" }),
        credentials: "same-origin",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Reject failed");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusy(null);
    }
  }

  const suggested = actions.filter((a) => a.status === "suggested");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void run()}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {busy === "run" ? "Running…" : "Run revenue analysis"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void applySafe()}
          className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-50"
        >
          {busy === "apply" ? "Applying…" : "Apply safe actions"}
        </button>
      </div>
      {msg ? <p className="text-sm text-slate-700">{msg}</p> : null}

      <div>
        <h3 className="text-base font-semibold text-slate-900">Suggested actions</h3>
        <ul className="mt-2 space-y-3">
          {suggested.length === 0 ? (
            <li className="text-sm text-slate-500">None — run analysis.</li>
          ) : (
            suggested.map((a) => (
              <li key={a.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                <div className="font-medium text-slate-900">{a.title}</div>
                <p className="mt-1 text-slate-600">{a.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {a.priority} · {a.actionType}
                  {a.estimatedUpliftCents != null
                    ? ` · est. upside ${(a.estimatedUpliftCents / 100).toFixed(0)}`
                    : ""}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void approve(a.id)}
                    className="rounded border border-emerald-400 bg-white px-2 py-1 text-xs font-semibold text-emerald-900"
                  >
                    {busy === a.id ? "…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void reject(a.id)}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <p className="text-xs text-slate-500">
        See also{" "}
        <Link href={`${basePath}/dashboard/portfolio-autopilot`} className="text-emerald-800 underline">
          Portfolio autopilot
        </Link>{" "}
        and{" "}
        <Link href={`${basePath}/dashboard/autopilot`} className="text-emerald-800 underline">
          Listing autopilot
        </Link>
        .
      </p>
    </div>
  );
}
