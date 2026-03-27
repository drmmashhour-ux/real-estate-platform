"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const GOLD = "#C9A646";

function ReviewFormInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t")?.trim() ?? "";
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setStatus("err");
      setMsg("Invalid review link.");
      return;
    }
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/mortgage/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, comment, email: email.trim() || undefined }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("err");
        setMsg(j.error ?? "Could not submit review.");
        return;
      }
      setStatus("ok");
      setMsg("Thank you — your feedback helps clients choose the right expert.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-6">
      {status !== "idle" ? (
        <p className={status === "ok" ? "text-sm text-emerald-400" : "text-sm text-red-400"}>{msg}</p>
      ) : null}
      <label className="block text-xs font-semibold text-[#C9A646]/90">
        Rating (1–5)
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-semibold text-[#C9A646]/90">
        Comment (optional)
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs font-semibold text-[#C9A646]/90">
        Your email (optional)
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={loading || !token}
        className="w-full rounded-xl py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
        style={{ background: GOLD }}
      >
        {loading ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}

export function ReviewFormClient() {
  return (
    <Suspense fallback={<p className="mt-8 text-[#B3B3B3]">Loading…</p>}>
      <ReviewFormInner />
    </Suspense>
  );
}
