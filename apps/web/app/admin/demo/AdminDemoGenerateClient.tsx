"use client";

import { useState } from "react";

export function AdminDemoGenerateClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setErr(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/demo/generate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "TESTER", prefix: "staging-tester" }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        email?: string;
        password?: string;
        role?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "Request failed");
        return;
      }
      setResult(
        `Created ${j.role}: ${j.email}\nPassword (copy now; not shown again):\n${j.password ?? ""}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => void generate()}
        className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-semibold text-[#0B0B0B] disabled:opacity-50"
      >
        {loading ? "Creating…" : "Generate test user"}
      </button>
      {err ? <p className="text-xs text-red-400">{err}</p> : null}
      {result ? (
        <pre className="whitespace-pre-wrap break-all rounded-lg bg-black/50 p-3 text-xs text-emerald-100">{result}</pre>
      ) : null}
    </div>
  );
}
