"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { referralRef?: string };

export function SignupAccountClient({ referralRef = "" }: Props) {
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
    const password = String(fd.get("password") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");
    if (password !== confirmPassword) {
      setErr("Password and confirmation do not match.");
      setLoading(false);
      return;
    }
    const body = {
      email: String(fd.get("email") ?? "").trim(),
      password,
      confirmPassword,
      acceptLegal: true,
      ...(referralRef ? { ref: referralRef } : {}),
    };
    try {
      const url = referralRef
        ? `/api/auth/register?ref=${encodeURIComponent(referralRef)}`
        : "/api/auth/register";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        needsEmailVerification?: boolean;
      };
      if (!res.ok) {
        setErr(j.error ?? "Could not create account");
        return;
      }
      if (j.needsEmailVerification) {
        router.push("/auth/login?registered=1");
        router.refresh();
        return;
      }
      router.push("/onboarding");
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
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Confirm password</label>
        <input
          name="confirmPassword"
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
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
