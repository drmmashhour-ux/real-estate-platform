"use client";

import { useState } from "react";

export function HostJoinClient({ locale, country }: { locale: string; country: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErr(null);
    try {
      const res = await fetch("/api/growth/public/host-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          propertyType: propertyType.trim() || undefined,
          message: `Host join · ${propertyType || "property"} · locale ${locale}/${country}`,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Could not save");
        setStatus("err");
        return;
      }
      setStatus("ok");
    } catch {
      setErr("Network error");
      setStatus("err");
    }
  }

  if (status === "ok") {
    return (
      <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
        Thanks — we received your details. The BNHub team will follow up shortly.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6">
      <h2 className="text-lg font-semibold text-white">Tell us about your place</h2>
      <p className="text-sm text-white/55">List your property in minutes — we route this to supply onboarding.</p>
      <ul className="list-inside list-disc space-y-1 text-sm text-white/65">
        <li>More visibility on LECIPM + BNHub discovery</li>
        <li>AI pricing signals where enabled</li>
        <li>Early platform boost for qualified hosts</li>
      </ul>
      <input
        required
        className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        required
        type="email"
        className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white"
        placeholder="Property type (e.g. condo, duplex)"
        value={propertyType}
        onChange={(e) => setPropertyType(e.target.value)}
      />
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Get started"}
      </button>
    </form>
  );
}
