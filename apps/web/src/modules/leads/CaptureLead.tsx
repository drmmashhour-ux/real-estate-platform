"use client";

import { useState } from "react";

type Props = {
  className?: string;
  buttonLabel?: string;
  placeholder?: string;
};

export function CaptureLead({
  className = "",
  buttonLabel = "Get updates",
  placeholder = "you@email.com",
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
      const r = await fetch("/api/lecipm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "launch_lead_capture", email: trimmed }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setMessage(j.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("done");
      setMessage("Thanks — you are on the list.");
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
    <form onSubmit={onSubmit} className={`flex flex-col gap-2 sm:flex-row sm:items-center ${className}`}>
      <input
        type="email"
        name="email"
        autoComplete="email"
        placeholder={placeholder}
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        disabled={status === "loading"}
        className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-600 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : buttonLabel}
      </button>
      {message && status === "error" ? <p className="w-full text-sm text-red-300 sm:order-last">{message}</p> : null}
    </form>
  );
}
