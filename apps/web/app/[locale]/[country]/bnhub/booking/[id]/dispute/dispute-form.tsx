"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DisputeForm({
  bookingId,
  claimant,
  claimantUserId,
  listingTitle,
}: {
  bookingId: string;
  claimant: "GUEST" | "HOST";
  claimantUserId: string;
  listingTitle: string;
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/bnhub/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          claimant,
          claimantUserId,
          description,
          evidenceUrls: evidenceUrls.split(",").map((u) => u.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      router.push(`/bnhub/booking/${bookingId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <p className="text-sm text-slate-400">
        Describe the issue (e.g. property not as described, cancellation conflict, damage, payment). Our team will review and follow up.
      </p>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Evidence URLs (comma-separated, optional)</label>
        <input
          type="text"
          value={evidenceUrls}
          onChange={(e) => setEvidenceUrls(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit dispute"}
      </button>
    </form>
  );
}
