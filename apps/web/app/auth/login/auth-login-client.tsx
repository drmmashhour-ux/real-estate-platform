"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { getDefaultHub } from "@/lib/hub/router";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";
import { identifyUser } from "@/lib/analytics";

const SHOW_STAGING_DEMO =
  process.env.NEXT_PUBLIC_ENV === "staging" &&
  (process.env.NEXT_PUBLIC_SHOW_STAGING_DEMO_LOGIN === "1" ||
    process.env.NEXT_PUBLIC_SHOW_STAGING_DEMO_LOGIN === "true");

/** Staging or explicit client demo flag — matches server `isDemoQuickLoginAllowed` when paired with DEMO_MODE. */
const SHOW_DEMO_QUICK_LOGIN =
  process.env.NEXT_PUBLIC_ENV === "staging" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function AuthLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam =
    searchParams.get("next")?.trim() || searchParams.get("returnUrl")?.trim() || "";
  const registered = searchParams.get("registered") === "1";
  const verified = searchParams.get("verified") === "1";
  const urlError = searchParams.get("error")?.trim() ?? "";
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState<string | null>(null);
  const [twoFactorEmail, setTwoFactorEmail] = useState<string | null>(null);
  const passwordRef = useRef("");

  async function loginAsDemoEmail(email: string) {
    setErr("");
    setQuickLoading(email);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        role?: string;
        userId?: string;
        email?: string;
      };
      if (!res.ok || !j.ok) {
        setErr(j.error ?? "Demo sign-in is not available.");
        return;
      }
      if (j.userId && j.email) {
        identifyUser({ id: j.userId, email: j.email });
      }
      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ENV === "staging") {
        try {
          localStorage.setItem("lecipm_demo_pending_autostart", "1");
        } catch {
          /* ignore */
        }
      }
      router.push(getDefaultHub({ role: j.role ?? "USER" }));
      router.refresh();
    } finally {
      setQuickLoading(null);
    }
  }

  async function loginAsDemo() {
    setErr("");
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/staging-demo-login", { method: "POST", credentials: "same-origin" });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        role?: string;
        userId?: string;
        email?: string;
      };
      if (!res.ok || !j.ok) {
        setErr(j.error ?? "Demo sign-in is not available.");
        return;
      }
      if (j.userId && j.email) {
        identifyUser({ id: j.userId, email: j.email });
      }
      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ENV === "staging") {
        try {
          localStorage.setItem("lecipm_demo_pending_autostart", "1");
        } catch {
          /* ignore */
        }
      }
      router.push(getDefaultHub({ role: j.role ?? "USER" }));
      router.refresh();
    } finally {
      setDemoLoading(false);
    }
  }

  function afterLoginSuccess(j: {
    role?: string;
    expertTermsAccepted?: boolean;
  }) {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ENV === "staging") {
      try {
        localStorage.setItem("lecipm_demo_pending_autostart", "1");
      } catch {
        /* ignore */
      }
    }
    if (nextParam.startsWith("/")) {
      router.push(nextParam);
      router.refresh();
      return;
    }
    if (isMortgageExpertRole(j.role)) {
      if (j.expertTermsAccepted === false) {
        router.push("/expert/terms");
      } else {
        router.push("/dashboard/expert");
      }
      router.refresh();
      return;
    }
    router.push(getDefaultHub({ role: j.role ?? "USER" }));
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const twoFaCode = String(fd.get("twoFaCode") ?? "").trim();

    try {
      if (twoFactorEmail) {
        const res = await fetch("/api/auth/login/verify-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ email: twoFactorEmail, code: twoFaCode }),
        });
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          role?: string;
          ok?: boolean;
          expertTermsAccepted?: boolean;
          userId?: string;
          email?: string;
        };
        if (!res.ok) {
          setErr(j.error ?? "Verification failed");
          return;
        }
        setTwoFactorEmail(null);
        afterLoginSuccess(j);
        return;
      }

      passwordRef.current = password;
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        role?: string;
        ok?: boolean;
        expertTermsAccepted?: boolean;
        requiresTwoFactor?: boolean;
        emailMasked?: string;
        userId?: string;
        email?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "Login failed");
        return;
      }
      if (j.requiresTwoFactor) {
        setTwoFactorEmail(email);
        setErr("");
        return;
      }
      afterLoginSuccess(j);
    } finally {
      setLoading(false);
    }
  }

  async function resendTwoFactor() {
    if (!twoFactorEmail || !passwordRef.current) return;
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: twoFactorEmail, password: passwordRef.current }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; requiresTwoFactor?: boolean };
      if (!res.ok) {
        setErr(j.error ?? "Could not resend code");
        return;
      }
      if (!j.requiresTwoFactor) {
        setErr("Sign in again to request a new code.");
        setTwoFactorEmail(null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-6">
      {registered ? (
        <p className="text-sm leading-relaxed text-emerald-300">
          Account created. Check your email for the confirmation link from LECIPM. After you confirm, sign in below to
          complete your profile and use the dashboard.
        </p>
      ) : null}
      {verified ? (
        <p className="text-sm leading-relaxed text-emerald-300">
          Email confirmed. Sign in with your password to continue — you&apos;ll be guided to complete your profile.
        </p>
      ) : null}
      {urlError === "invalid_token" || urlError === "missing_token" ? (
        <p className="text-sm text-amber-300">
          {urlError === "missing_token"
            ? "Verification link is incomplete. Use the link from your email, or sign up again."
            : "This confirmation link is invalid or has expired. Sign up again or contact support."}
        </p>
      ) : null}
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {twoFactorEmail ? (
        <>
          <p className="text-sm text-[#B3B3B3]">
            Enter the 6-digit code we sent to <span className="text-white">{twoFactorEmail}</span>. It expires in 5
            minutes.
          </p>
          <input type="hidden" name="email" value={twoFactorEmail} />
        </>
      ) : (
        <div>
          <label className="text-xs font-semibold text-premium-gold/90">Email</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
          />
        </div>
      )}
      {!twoFactorEmail ? (
        <div>
          <label className="text-xs font-semibold text-premium-gold/90">Password</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
          />
        </div>
      ) : (
        <div>
          <label className="text-xs font-semibold text-premium-gold/90">Verification code</label>
          <input
            name="twoFaCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm tracking-widest"
          />
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-premium-gold py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
      >
        {loading ? (twoFactorEmail ? "Verifying…" : "Signing in…") : twoFactorEmail ? "Verify & continue" : "Sign in"}
      </button>
      {twoFactorEmail ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void resendTwoFactor()}
          className="w-full rounded-xl border border-white/15 py-2.5 text-sm text-premium-gold disabled:opacity-50"
        >
          Resend code
        </button>
      ) : null}
      {SHOW_STAGING_DEMO ? (
        <div className="border-t border-white/10 pt-4">
          <p className="text-center text-xs text-[#737373]">Staging only</p>
          <button
            type="button"
            disabled={demoLoading || loading || !!quickLoading}
            onClick={() => void loginAsDemo()}
            className="mt-2 w-full rounded-xl border border-premium-gold/50 bg-transparent py-3 text-sm font-semibold text-premium-gold disabled:opacity-50"
          >
            {demoLoading ? "Signing in…" : "Login as Demo User"}
          </button>
          <p className="mt-2 text-center text-[11px] text-[#5C5C5C]">
            Or use email <span className="text-[#B3B3B3]">demo@platform.com</span> with password from your staging seed.
          </p>
        </div>
      ) : null}
      {SHOW_DEMO_QUICK_LOGIN ? (
        <div className="border-t border-white/10 pt-4">
          <p className="text-center text-xs font-medium text-premium-gold/90">Investor demo — one-click sign-in</p>
          <p className="mt-1 text-center text-xs text-[#737373]">
            After seed: <span className="text-[#B3B3B3]">guest@demo.com</span> uses{" "}
            <span className="text-[#B3B3B3]">DemoGuest2024!</span>; other seed emails use{" "}
            <span className="text-[#B3B3B3]">Demo123!</span>
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              disabled={!!quickLoading || loading || demoLoading}
              onClick={() => void loginAsDemoEmail("sarah@prestige.demo")}
              className="rounded-xl border border-premium-gold/40 bg-[#1a1a1a] py-2.5 text-xs font-semibold text-premium-gold disabled:opacity-50"
            >
              {quickLoading === "sarah@prestige.demo" ? "…" : "Login as Admin"}
            </button>
            <button
              type="button"
              disabled={!!quickLoading || loading || demoLoading}
              onClick={() => void loginAsDemoEmail("david@prestige.demo")}
              className="rounded-xl border border-premium-gold/40 bg-[#1a1a1a] py-2.5 text-xs font-semibold text-premium-gold disabled:opacity-50"
            >
              {quickLoading === "david@prestige.demo" ? "…" : "Login as Broker"}
            </button>
            <button
              type="button"
              disabled={!!quickLoading || loading || demoLoading}
              onClick={() => void loginAsDemoEmail("michael@client.demo")}
              className="rounded-xl border border-premium-gold/40 bg-[#1a1a1a] py-2.5 text-xs font-semibold text-premium-gold disabled:opacity-50"
            >
              {quickLoading === "michael@client.demo" ? "…" : "Login as Client"}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

export function AuthLoginClient() {
  return (
    <Suspense fallback={<p className="mt-8 text-[#B3B3B3]">Loading…</p>}>
      <AuthLoginInner />
    </Suspense>
  );
}
