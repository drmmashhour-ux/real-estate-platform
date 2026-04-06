"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

export function VerifyContactClient() {
  const [auth, setAuth] = useState<"unknown" | "in" | "out">("unknown");
  const [status, setStatus] = useState<{
    emailVerified: boolean;
    phoneVerified: boolean;
    hasPhoneOnFile: boolean;
    smsDeliveryConfigured: boolean;
  } | null>(null);
  const [channel, setChannel] = useState<"EMAIL" | "SMS">("EMAIL");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/account/contact-verification/status", { credentials: "include" });
    if (res.status === 401) {
      setAuth("out");
      setStatus(null);
      return;
    }
    setAuth("in");
    const data = (await res.json()) as NonNullable<typeof status>;
    setStatus(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendCode() {
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/contact-verification/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          ...(channel === "SMS" && phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string; destinationMask?: string; devCode?: string };
      if (!res.ok) {
        setErr(data.error ?? "Send failed");
        return;
      }
      setMsg(
        `Code sent to ${data.destinationMask ?? "your contact"}.${data.devCode ? ` (dev: ${data.devCode})` : ""}`
      );
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode() {
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/contact-verification/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, code: code.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Verification failed");
        return;
      }
      setMsg(channel === "EMAIL" ? "Email verified." : "Mobile number verified.");
      setCode("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  if (auth === "unknown") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-slate-600">
        <p>Loading…</p>
      </div>
    );
  }

  if (auth === "out") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-slate-600">
        <p className="mb-4">Sign in to verify your email or mobile.</p>
        <Link href="/auth/login" className="text-amber-700 underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Verify your contact</h1>
      <p className="mt-2 text-sm text-slate-600">
        Use a one-time code sent to your email or phone. Required for trusted actions across the platform (including
        hosting).
      </p>

      {status ? (
        <ul className="mt-4 space-y-1 text-sm text-slate-700">
          <li>Email: {status.emailVerified ? "Verified" : "Not verified"}</li>
          <li>Mobile: {status.phoneVerified ? "Verified" : "Not verified"}</li>
          {!status.smsDeliveryConfigured ? (
            <li className="text-amber-800">SMS requires Twilio env vars on the server.</li>
          ) : null}
        </ul>
      ) : null}

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setChannel("EMAIL")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            channel === "EMAIL" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"
          }`}
        >
          Email code
        </button>
        <button
          type="button"
          onClick={() => setChannel("SMS")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            channel === "SMS" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"
          }`}
        >
          SMS code
        </button>
      </div>

      {channel === "SMS" ? (
        <label className="mt-4 block text-sm">
          <span className="text-slate-600">Mobile (E.164, e.g. +15145550100)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder={status?.hasPhoneOnFile ? "Optional if already on profile" : "+1…"}
            autoComplete="tel"
          />
        </label>
      ) : null}

      <button
        type="button"
        disabled={loading}
        onClick={() => void sendCode()}
        className="mt-4 w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send code"}
      </button>

      <label className="mt-6 block text-sm">
        <span className="text-slate-600">6-digit code</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono tracking-widest"
          inputMode="numeric"
          maxLength={6}
        />
      </label>

      <button
        type="button"
        disabled={loading || code.length !== 6}
        onClick={() => void confirmCode()}
        className="mt-3 w-full rounded-lg border border-slate-900 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
      >
        Confirm code
      </button>

      {msg ? <p className="mt-4 text-sm text-emerald-700">{msg}</p> : null}
      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}

      <p className="mt-8 text-center text-sm text-slate-500">
        <Link href="/dashboard" className="underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
