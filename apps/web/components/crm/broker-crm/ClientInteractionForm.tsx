"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BrokerInteractionType } from "@prisma/client";

const TYPES: { value: BrokerInteractionType; label: string }[] = [
  { value: "NOTE", label: "Note" },
  { value: "CALL", label: "Call" },
  { value: "MEETING", label: "Meeting" },
  { value: "TASK", label: "Task" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "EMAIL", label: "Email" },
];

export function ClientInteractionForm({
  clientId,
  onCreated,
}: {
  clientId: string;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [type, setType] = useState<BrokerInteractionType>("NOTE");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const body: Record<string, unknown> = { type, title: title || undefined, message: message || undefined };
    if ((type === "TASK" || type === "FOLLOW_UP") && dueAt) {
      body.dueAt = new Date(dueAt).toISOString();
    }
    const res = await fetch(`/api/broker/clients/${clientId}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setErr(j.error ?? "Could not save");
      return;
    }
    setTitle("");
    setMessage("");
    setDueAt("");
    onCreated?.();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-400">
          Type
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={type}
            onChange={(e) => setType(e.target.value as BrokerInteractionType)}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {(type === "TASK" || type === "FOLLOW_UP") && (
          <label className="block text-xs font-medium text-slate-400">
            Due
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </label>
        )}
      </div>
      <label className="block text-xs font-medium text-slate-400">
        Title (optional)
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
      </label>
      <label className="block text-xs font-medium text-slate-400">
        Details
        <textarea
          className="mt-1 min-h-[88px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={20000}
        />
      </label>
      {err ? <p className="text-sm text-red-300">{err}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Add interaction"}
      </button>
    </form>
  );
}
