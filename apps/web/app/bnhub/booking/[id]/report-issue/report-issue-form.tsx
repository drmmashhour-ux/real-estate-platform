"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ISSUE_TYPES = [
  { value: "misrepresentation", label: "Property not as described" },
  { value: "cleanliness", label: "Cleanliness issues" },
  { value: "access", label: "Access / check-in problems" },
  { value: "safety", label: "Safety concerns" },
  { value: "amenities", label: "Missing or broken amenities" },
  { value: "refund-request", label: "Refund request" },
  { value: "other", label: "Other" },
];

export function ReportIssueForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issueType.trim() || !description.trim()) {
      setError("Please select an issue type and provide a description.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bnhub/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, issueType: issueType.trim(), description: description.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-800 bg-emerald-950/40 p-6">
        <p className="font-medium text-emerald-200">Issue reported</p>
        <p className="mt-2 text-sm text-slate-400">
          We’ve received your report and will review it. We may contact you and the host. You can check the status from your booking page.
        </p>
        <Link
          href={`/bnhub/booking/${bookingId}`}
          className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
        >
          Back to booking
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <label className="block text-sm font-medium text-slate-400">Issue type</label>
        <select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Select…</option>
          {ISSUE_TYPES.map((opt) => (
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
          placeholder="Describe what happened and how the property did not meet expectations…"
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
        <Link
          href={`/bnhub/booking/${bookingId}`}
          className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
