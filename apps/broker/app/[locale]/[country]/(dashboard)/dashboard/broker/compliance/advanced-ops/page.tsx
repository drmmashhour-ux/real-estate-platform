"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

export default function AdvancedComplianceOpsPage() {
  const [ownerType, setOwnerType] = useState("solo_broker");
  const [ownerId, setOwnerId] = useState("");
  const [scopeType, setScopeType] = useState("broker");
  const [scopeId, setScopeId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const runTrustReconciliation = useCallback(async () => {
    setBusy("reconcile");
    setLastResult(null);
    try {
      const res = await fetch("/api/compliance/trust/reconcile", {
        method: "POST",
        body: JSON.stringify({ ownerType, ownerId }),
        headers: { "Content-Type": "application/json" },
      });
      const json = (await res.json()) as { success?: boolean; run?: unknown; error?: string };
      setLastResult(JSON.stringify(json, null, 2));
    } finally {
      setBusy(null);
    }
  }, [ownerType, ownerId]);

  const generateExport = useCallback(async () => {
    setBusy("export");
    setLastResult(null);
    try {
      const res = await fetch("/api/compliance/export/pdf", {
        method: "POST",
        body: JSON.stringify({
          ownerType,
          ownerId,
          exportType: "oaciq_packet",
          scopeType,
          scopeId: scopeId.trim() || null,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const json = (await res.json()) as { success?: boolean; run?: unknown; error?: string; message?: string };
      setLastResult(JSON.stringify(json, null, 2));
    } finally {
      setBusy(null);
    }
  }, [ownerType, ownerId, scopeType, scopeId]);

  return (
    <div className="space-y-6 p-6 text-white">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-[#D4AF37]">Advanced compliance operations</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/60">
          Regulator-oriented export manifests, trust reconciliation, and AI autopilot review flows. All regulated
          actions remain human-gated; manifests are JSON today with PDF assembly wired later.{" "}
          <Link href="/dashboard/broker/compliance/inspection" className="text-[#D4AF37] underline">
            Inspection simulator
          </Link>
        </p>
      </div>

      <div className="grid max-w-xl gap-4">
        <select
          className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
          value={ownerType}
          onChange={(e) => setOwnerType(e.target.value)}
        >
          <option value="solo_broker">Solo broker</option>
          <option value="agency">Agency</option>
          <option value="platform">Platform</option>
        </select>
        <input
          className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
          placeholder="Owner ID (use your user id for solo_broker — admin may pass any)"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
        />
        <select
          className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
          value={scopeType}
          onChange={(e) => setScopeType(e.target.value)}
        >
          <option value="broker">Broker-wide scope</option>
          <option value="listing">Listing scope</option>
          <option value="complaint">Complaint scope</option>
          <option value="date_range">Date range (metadata only)</option>
        </select>
        <input
          className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
          placeholder="Scope ID (e.g. listing id when scope is listing)"
          value={scopeId}
          onChange={(e) => setScopeId(e.target.value)}
        />
        <button
          type="button"
          onClick={runTrustReconciliation}
          disabled={busy !== null || !ownerId.trim()}
          className="rounded-lg bg-[#D4AF37] px-4 py-3 font-semibold text-black disabled:opacity-50"
        >
          {busy === "reconcile" ? "Running…" : "Run trust reconciliation"}
        </button>
        <button
          type="button"
          onClick={generateExport}
          disabled={busy !== null || !ownerId.trim()}
          className="rounded-lg bg-[#D4AF37] px-4 py-3 font-semibold text-black disabled:opacity-50"
        >
          {busy === "export" ? "Generating…" : "Generate regulator export manifest"}
        </button>
      </div>

      {lastResult ? (
        <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/80">
          {lastResult}
        </pre>
      ) : null}
    </div>
  );
}
