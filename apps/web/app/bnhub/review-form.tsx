"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewForm({
  bookingId,
  listingId,
  listingTitle,
  guestId: guestIdProp,
}: {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  guestId?: string | null;
}) {
  const router = useRouter();
  const [propertyRating, setPropertyRating] = useState(5);
  const [hostRating, setHostRating] = useState<number | "">(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const guestId = guestIdProp ?? process.env.NEXT_PUBLIC_DEMO_GUEST_ID ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!guestId) {
      setError("Sign in required to submit review.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bnhub/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          guestId,
          listingId,
          propertyRating,
          hostRating: hostRating === "" ? undefined : hostRating,
          comment: comment || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit review");
      router.push(`/bnhub/${listingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      <p className="text-sm text-slate-400">Your review will be part of the listing&apos;s trust score.</p>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Property rating (1–5)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPropertyRating(n)}
              className={`h-10 w-10 rounded-full text-sm font-medium transition ${
                propertyRating === n
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Host rating (1–5, optional)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setHostRating(n)}
              className={`h-10 w-10 rounded-full text-sm font-medium transition ${
                hostRating === n
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
