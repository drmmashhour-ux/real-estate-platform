"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupBrokerClient() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [legalOk, setLegalOk] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    if (!legalOk) {
      setErr("Please agree to the Terms, Privacy, and Platform Rules to continue.");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      fullName: String(fd.get("fullName") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
      acceptLegal: true,
    };
    try {
      const res = await fetch("/api/auth/register-mortgage-broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Could not create account");
        return;
      }
      router.push("/broker/complete-profile");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-6 text-left"
    >
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Full name</label>
        <input
          name="fullName"
          required
          autoComplete="name"
          className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Password (min 8 characters)</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
        />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#C9A646]/25 bg-[#0B0B0B]/80 p-3 text-sm text-[#D4D4D4]">
        <input
          type="checkbox"
          checked={legalOk}
          onChange={(e) => setLegalOk(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-[#C9A646]/50 text-[#C9A646] focus:ring-[#C9A646]"
        />
        <span>
          I agree to the{" "}
          <Link href="/legal/terms" className="font-semibold text-[#C9A646] hover:underline">
            Terms
          </Link>
          ,{" "}
          <Link href="/legal/privacy" className="font-semibold text-[#C9A646] hover:underline">
            Privacy
          </Link>
          , and{" "}
          <Link href="/legal/platform-usage" className="font-semibold text-[#C9A646] hover:underline">
            Platform Rules
          </Link>
          .
        </span>
      </label>
      <button
        type="submit"
        disabled={loading || !legalOk}
        className="w-full rounded-xl bg-[#C9A646] py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create mortgage broker account"}
      </button>
    </form>
  );
}
