"use client";

import { useState } from "react";

export const TRUST_SAFETY_REPORT_TYPES = [
  { value: "misleading_listing", label: "Misleading listing" },
  { value: "fraud", label: "Fraud" },
  { value: "poor_condition", label: "Poor condition" },
] as const;

type Props = {
  listingId?: string | null;
  bookingId?: string | null;
  listingTitle?: string;
  backHref: string;
  backLabel: string;
};

export function TrustSafetyReportForm({
  listingId,
  bookingId,
  listingTitle,
  backHref,
  backLabel,
}: Props) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category.trim() || !description.trim()) {
      setError("Please select a report type and provide a description.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trust-safety/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentCategory: category.trim(),
          description: description.trim(),
          listingId: listingId ?? undefined,
          bookingId: bookingId ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to submit report");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-800 bg-emerald-950/40 p-6">
        <p className="font-medium text-emerald-200">Report submitted</p>
        <p className="mt-2 text-sm text-slate-400">
          We’ve received your report and will review it. Our team may follow up with you or the host.
        </p>
        <a
          href={backHref}
          className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
        >
          {backLabel}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <label className="block text-sm font-medium text-slate-400">Report type</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        >
          <option value="">Select…</option>
          {TRUST_SAFETY_REPORT_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-400">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Describe what’s wrong. Include details that help our team review (e.g. photos don’t match, safety issues, suspected fraud)."
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
      </div>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit report"}
        </button>
        <a
          href={backHref}
          className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
