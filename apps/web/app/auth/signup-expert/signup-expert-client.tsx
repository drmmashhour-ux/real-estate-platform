"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { identifyUser } from "@/lib/analytics";

export function SignupExpertClient() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [legalOk, setLegalOk] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    if (!legalOk) {
      setErr("Please confirm you agree to the Terms, Privacy Policy, and Platform Rules.");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
      name: String(fd.get("name") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      company: String(fd.get("company") ?? "").trim(),
      license: String(fd.get("license") ?? "").trim(),
      role: "MORTGAGE_EXPERT",
      acceptLegal: true,
    };
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; userId?: string; email?: string };
      if (!res.ok) {
        setErr(j.error ?? "Signup failed");
        return;
      }
      if (j.userId && j.email) {
        identifyUser({ id: j.userId, email: j.email });
      }
      router.push("/expert/terms");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-6">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Full name *</label>
        <input name="name" required className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Email *</label>
        <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Password * (min 8)</label>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Phone</label>
        <input name="phone" type="tel" autoComplete="tel" className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">License # (optional)</label>
        <input name="license" className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Company (optional)</label>
        <input name="company" className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm" />
      </div>
      <button
        type="submit"
        disabled={loading || !legalOk}
        className="w-full rounded-xl bg-[#C9A646] py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create expert account"}
      </button>
    </form>
  );
}
