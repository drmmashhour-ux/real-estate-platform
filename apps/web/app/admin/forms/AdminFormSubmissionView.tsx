"use client";

import { useState } from "react";
import Link from "next/link";
import { PrintPageButton } from "@/components/ui/PrintPageButton";

type Submission = {
  id: string;
  formType: string;
  status: string;
  clientName: string | null;
  clientEmail: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  payloadJson: Record<string, unknown>;
};

type Activity = { id: string; action: string; note: string | null; createdAt: string };

const STATUSES = ["draft", "submitted", "in-review", "approved", "rejected", "completed"] as const;

export function AdminFormSubmissionView({
  submission: initial,
  activities,
}: {
  submission: Submission;
  activities: Activity[];
}) {
  const [submission, setSubmission] = useState(initial);
  const [payload, setPayload] = useState(initial.payloadJson);
  const [saving, setSaving] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [sendingForSign, setSendingForSign] = useState(false);

  async function saveDraft() {
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          status: submission.status,
          clientName: submission.clientName,
          clientEmail: submission.clientEmail,
          note: "Draft saved by admin",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSubmission(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(newStatus: string) {
    setStatusChanging(true);
    try {
      const res = await fetch(`/api/forms/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSubmission(updated);
      }
    } finally {
      setStatusChanging(false);
    }
  }

  async function sendForSign() {
    setSendingForSign(true);
    try {
      const res = await fetch(`/api/forms/${submission.id}/send-for-sign`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmission((current) => ({
          ...current,
          status: typeof data?.status === "string" ? data.status : current.status,
        }));
      }
    } finally {
      setSendingForSign(false);
    }
  }

  function updateField(key: string, value: unknown) {
    setPayload((p) => ({ ...p, [key]: value }));
  }

  const payloadEntries = Object.entries(payload).filter(
    ([k]) => !k.startsWith("_")
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold capitalize">
          {submission.formType.replace(/-/g, " ")} — {submission.id.slice(0, 8)}
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Client: {submission.clientName || "—"} {submission.clientEmail && `(${submission.clientEmail})`}
        </p>
        <p className="text-slate-500 text-sm">
          Created {new Date(submission.createdAt).toLocaleString()} · Updated{" "}
          {new Date(submission.updatedAt).toLocaleString()}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <PrintPageButton label="Print file" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-400 hover:bg-slate-900" />
          <Link
            href={`/forms/file/${submission.id}`}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-400 hover:bg-slate-900"
          >
            Open client file
          </Link>
        </div>
      </header>

      {/* Status workflow */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Status</h2>
        <p className="mt-1 text-sm text-slate-500">Current: {submission.status}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              disabled={statusChanging || s === submission.status}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                s === submission.status
                  ? "bg-amber-500/30 text-amber-200"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50"
              }`}
            >
              {s === "in-review" ? "In review" : s}
            </button>
          ))}
        </div>
      </section>

      {/* Editable structured fields */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Structured fields</h2>
        <p className="mt-1 text-sm text-slate-500">Edit values below. Save draft to persist.</p>
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-start gap-2">
            <label className="w-48 shrink-0 truncate text-sm font-medium text-slate-400">
              clientName
            </label>
            <input
              type="text"
              value={submission.clientName ?? ""}
              onChange={(e) => setSubmission((current) => ({ ...current, clientName: e.target.value || null }))}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <label className="w-48 shrink-0 truncate text-sm font-medium text-slate-400">
              clientEmail
            </label>
            <input
              type="email"
              value={submission.clientEmail ?? ""}
              onChange={(e) => setSubmission((current) => ({ ...current, clientEmail: e.target.value || null }))}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </div>
          {payloadEntries.map(([key, value]) => (
            <div key={key} className="flex flex-wrap items-start gap-2">
              <label className="w-48 shrink-0 truncate text-sm font-medium text-slate-400">
                {key}
              </label>
              {typeof value === "boolean" ? (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateField(key, e.target.checked)}
                  className="rounded border-slate-600 bg-slate-950 text-amber-500"
                />
              ) : (
                <input
                  type="text"
                  value={String(value ?? "")}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={saveDraft}
          disabled={saving}
          className="mt-6 rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
      </section>

      {/* Actions */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStatus("in-review")}
            disabled={statusChanging || submission.status === "in-review"}
            className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
          >
            Mark in review
          </button>
          <button
            type="button"
            onClick={() => setStatus("approved")}
            disabled={statusChanging || submission.status === "approved"}
            className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setStatus("rejected")}
            disabled={statusChanging || submission.status === "rejected"}
            className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={sendForSign}
            disabled={sendingForSign || !submission.clientEmail}
            className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
          >
            {sendingForSign ? "Sending..." : "Send by email for sign & return"}
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800"
            title="PDF generation placeholder"
          >
            Generate PDF (placeholder)
          </button>
        </div>
      </section>

      {/* Activity log */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Activity log</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {activities.map((a) => (
            <li key={a.id} className="flex flex-wrap gap-2 text-slate-400">
              <span className="text-slate-500">
                {new Date(a.createdAt).toLocaleString()}
              </span>
              <span className="font-medium text-slate-300">{a.action}</span>
              {a.note && <span>{a.note}</span>}
            </li>
          ))}
          {activities.length === 0 && (
            <li className="text-slate-500">No activity yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
