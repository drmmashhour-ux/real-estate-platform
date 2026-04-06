"use client";

import { useState } from "react";

type Props = {
  className?: string;
  source?: string;
  placeholder?: string;
  buttonLabel?: string;
  successMessage?: string;
};

export function EmailCapture({
  className = "",
  source = "landing",
  placeholder = "Work email",
  buttonLabel = "Join waitlist",
  successMessage = "You are on the list. We will be in touch.",
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setMessage("Enter a valid email.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setMessage(j.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("done");
      setMessage(successMessage);
      setEmail("");
    } catch {
      setMessage("Network error — try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className={`text-sm text-emerald-400 ${className}`} role="status">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`flex flex-col gap-2 sm:flex-row sm:items-stretch ${className}`}>
      <input
        type="email"
        name="email"
        autoComplete="email"
        placeholder={placeholder}
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        disabled={status === "loading"}
        className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-premium-gold/60 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="min-h-11 shrink-0 rounded-xl bg-premium-gold px-5 text-sm font-semibold text-black hover:bg-premium-gold/90 disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : buttonLabel}
      </button>
      {message && status === "error" ? <p className="w-full text-sm text-red-300 sm:order-last">{message}</p> : null}
    </form>
  );
}
