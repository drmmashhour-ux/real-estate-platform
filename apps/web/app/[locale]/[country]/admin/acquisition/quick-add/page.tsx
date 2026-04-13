"use client";

import Link from "next/link";
import { useState } from "react";

export default function AcquisitionQuickAddPage() {
  const [json, setJson] = useState(`{
  "sourceType": "MANUAL",
  "contactName": "Example Owner",
  "contactEmail": "owner@example.com",
  "contactPhone": "+15145550199",
  "city": "Montreal",
  "propertyCategory": "Condo",
  "permissionStatus": "REQUESTED",
  "intakeStatus": "NEW",
  "notes": "Met at open house — permission pending",
  "description": "Short original summary in their words.",
  "priceCents": 45000000
}`);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const body = JSON.parse(json) as Record<string, unknown>;
      const res = await fetch("/api/admin/listing-acquisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      setMsg(`Created lead ${data.id}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Invalid JSON or request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/acquisition" className="text-sm text-[#D4AF37] hover:underline">
          ← Acquisition
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-[#D4AF37]">Quick add acquisition lead</h1>
        <p className="mt-2 text-sm text-white/60">
          For operators adding supply on behalf of owners/brokers/hosts. Use rewritten descriptions only — see{" "}
          <code className="text-white/80">docs/compliance/safe-listing-acquisition.md</code>.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <textarea
            className="h-80 w-full rounded border border-white/15 bg-black/50 p-3 font-mono text-sm text-white"
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />
          {msg ? <p className="text-sm text-white/70">{msg}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            {loading ? "Saving…" : "Create lead"}
          </button>
        </form>
      </div>
    </div>
  );
}
