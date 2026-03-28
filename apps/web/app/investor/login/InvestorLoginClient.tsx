"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const GOLD = "var(--color-premium-gold)";

export function InvestorLoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/investor/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/investor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setError(j.error ?? "Login failed");
        return;
      }
      router.push(next.startsWith("/investor") ? next : "/investor/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] px-4 py-16 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
          Investor portal
        </p>
        <h1 className="mt-3 text-center text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Restricted to <span className="text-slate-400">INVESTOR</span> accounts.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl py-3 text-sm font-bold text-black disabled:opacity-50"
            style={{ background: GOLD }}
          >
            {busy ? "Signing in…" : "Continue"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-600">
          <Link href="/investor" className="text-amber-500/90 hover:underline">
            ← Pitch
          </Link>
        </p>
      </div>
    </div>
  );
}
