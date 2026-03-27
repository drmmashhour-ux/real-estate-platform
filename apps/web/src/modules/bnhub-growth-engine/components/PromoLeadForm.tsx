"use client";

import { useState } from "react";

export function PromoLeadForm({ promoSlug }: { promoSlug: string }) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("idle");
    const r = await fetch("/api/bnhub/growth/promo-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promoSlug,
        fullName: fd.get("fullName"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        message: fd.get("message"),
        guestCount: fd.get("guestCount") ? Number(fd.get("guestCount")) : undefined,
        company: fd.get("company"),
      }),
    });
    const j = (await r.json()) as { error?: string };
    if (!r.ok) {
      setStatus("err");
      setMsg(j.error ?? "Failed");
      return;
    }
    setStatus("ok");
    setMsg("Thanks — the host will get your inquiry.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={onSubmit} className="relative mt-4 space-y-3">
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
      />
      <input
        name="fullName"
        required
        placeholder="Full name"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
      />
      <input
        name="phone"
        placeholder="Phone (optional)"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
      />
      <input
        name="guestCount"
        type="number"
        min={1}
        placeholder="Guests"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
      />
      <textarea
        name="message"
        rows={3}
        placeholder="Travel dates / questions"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
      />
      <button
        type="submit"
        className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
      >
        Submit inquiry
      </button>
      {status === "ok" ? <p className="text-sm text-emerald-400">{msg}</p> : null}
      {status === "err" ? <p className="text-sm text-red-400">{msg}</p> : null}
    </form>
  );
}
