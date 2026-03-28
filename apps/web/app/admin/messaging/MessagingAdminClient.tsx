"use client";

import { useState } from "react";

export function MessagingAdminClient() {
  const [userId, setUserId] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [objText, setObjText] = useState("");
  const [objPreview, setObjPreview] = useState<string | null>(null);

  async function sendManual(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const res = await fetch("/api/admin/messaging/manual-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subject, html }),
    });
    const j = await res.json().catch(() => ({}));
    setStatus(res.ok ? "Sent." : j.error ?? "Failed");
  }

  async function previewObjection(e: React.FormEvent) {
    e.preventDefault();
    setObjPreview(null);
    const res = await fetch("/api/admin/messaging/objection-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: objText }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setObjPreview(j.error ?? "Error");
      return;
    }
    setObjPreview(
      j.body ? `Type: ${j.templateType}\nSubject: ${j.subject ?? ""}\n\n${j.body}` : "No keyword match."
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold text-white">Manual send (override automation)</h2>
        <p className="mt-1 text-sm text-slate-500">Logged to message_logs with admin_manual.</p>
        <form className="mt-4 space-y-3" onSubmit={sendManual}>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="HTML body"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
          >
            Send email
          </button>
        </form>
        {status ? <p className="mt-2 text-sm text-slate-400">{status}</p> : null}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold text-white">Objection handler (preview)</h2>
        <p className="mt-1 text-sm text-slate-500">Paste user text — get matching script (no send).</p>
        <form className="mt-4 space-y-3" onSubmit={previewObjection}>
          <textarea
            className="min-h-[100px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder='e.g. "It seems expensive" or "Is this safe?"'
            value={objText}
            onChange={(e) => setObjText(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-amber-500/50"
          >
            Preview reply
          </button>
        </form>
        {objPreview ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs text-slate-300">{objPreview}</pre>
        ) : null}
      </section>
    </div>
  );
}
