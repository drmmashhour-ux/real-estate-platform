"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function SellPageLeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("submitting");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    if (!name || !email || !phone) {
      setStatus("error");
      setErrorMsg("Please fill in name, email, and phone.");
      return;
    }
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message:
            message ||
            "FREE consultation request — FSBO / sell page (licensed broker, OACIQ).",
          leadSource: "fsbo_sell_page",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[#C9A646]/25 bg-[#121212] p-6 shadow-lg sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="sell-lead-name" className="block text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">
            Name
          </label>
          <input
            id="sell-lead-name"
            name="name"
            required
            autoComplete="name"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#C9A646]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A646]/40"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="sell-lead-email" className="block text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">
            Email
          </label>
          <input
            id="sell-lead-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#C9A646]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A646]/40"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="sell-lead-phone" className="block text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">
            Phone
          </label>
          <input
            id="sell-lead-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#C9A646]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A646]/40"
            placeholder="+1 …"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sell-lead-message" className="block text-xs font-medium uppercase tracking-wider text-[#C9A646]/90">
            Message
          </label>
          <textarea
            id="sell-lead-message"
            name="message"
            rows={4}
            className="mt-1.5 w-full resize-y rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#C9A646]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A646]/40"
            placeholder="Tell us about your property or timeline…"
          />
        </div>
      </div>

      {status === "error" && errorMsg ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {errorMsg}
        </p>
      ) : null}
      {status === "success" ? (
        <p className="mt-4 text-sm font-medium text-emerald-400" role="status">
          Thank you — we&apos;ll be in touch shortly to schedule your consultation.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 w-full rounded-xl bg-[#C9A646] px-6 py-3.5 text-sm font-bold text-[#0B0B0B] shadow-md transition hover:bg-[#E8C547] disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Sending…" : "Request FREE consultation"}
      </button>
    </form>
  );
}
