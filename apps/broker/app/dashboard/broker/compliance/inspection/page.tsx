"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

export default function ComplianceInspectionPage() {
  const [dsLinked, setDsLinked] = useState(true);
  const [signature, setSignature] = useState(true);
  const [hash, setHash] = useState("sha256:demo");
  const [contractNumber, setContractNumber] = useState("PROMISE-2026-00001");
  const [persist, setPersist] = useState(false);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  const run = useCallback(async () => {
    setBusy(true);
    setLast(null);
    try {
      const res = await fetch("/api/compliance/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dsLinked,
          signature,
          hash: hash.trim() || null,
          contractNumber: contractNumber.trim() || null,
          persist,
        }),
      });
      const json = (await res.json()) as Record<string, unknown>;
      setLast(JSON.stringify(json, null, 2));
    } finally {
      setBusy(false);
    }
  }, [contractNumber, dsLinked, hash, persist, signature]);

  return (
    <div className="space-y-6 p-6 text-white">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-[#D4AF37]">Compliance inspection</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/60">
          Regulator-style checklist before release: seller declaration link, broker signature step, document hash, and
          platform contract number. Results can be stored for your audit trail when you enable persist.
        </p>
      </div>

      <div className="grid max-w-xl gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={dsLinked} onChange={(e) => setDsLinked(e.target.checked)} />
          DS linked to listing or contract
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={signature} onChange={(e) => setSignature(e.target.checked)} />
          Signature step complete (broker path)
        </label>
        <input
          className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          placeholder="Document hash"
        />
        <input
          className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
          value={contractNumber}
          onChange={(e) => setContractNumber(e.target.value)}
          placeholder="Contract registry number"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)} />
          Persist snapshot (compliance_inspections)
        </label>
        <button
          type="button"
          disabled={busy}
          className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          onClick={() => void run()}
        >
          {busy ? "Running…" : "Run inspection"}
        </button>
      </div>

      {last ? (
        <pre className="max-h-96 overflow-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs text-white/80">
          {last}
        </pre>
      ) : null}

      <section className="space-y-4 border-t border-white/10 pt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">Audit export bundles</h2>
        <p className="max-w-2xl text-sm text-white/55">
          Generate a read-only bundle of hashed audit records for inspection prep, complaint dossiers, or trust/financial
          reviews. Scope by owner; do not mix agency and solo broker streams.
        </p>

        <div className="grid max-w-2xl gap-3">
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
            placeholder="Owner ID"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          />
          <select
            className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
            value={bundleType}
            onChange={(e) => setBundleType(e.target.value)}
          >
            <option value="inspection">Inspection</option>
            <option value="complaint_dossier">Complaint dossier</option>
            <option value="trust_review">Trust review</option>
            <option value="financial_review">Financial review</option>
            <option value="broker_file">Broker file</option>
            <option value="listing_file">Listing file</option>
          </select>
          <input
            className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
            placeholder="Target entity type (optional)"
            value={targetEntityType}
            onChange={(e) => setTargetEntityType(e.target.value)}
          />
          <input
            className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
            placeholder="Target entity ID (optional)"
            value={targetEntityId}
            onChange={(e) => setTargetEntityId(e.target.value)}
          />
          <button
            type="button"
            disabled={bundleBusy || !ownerId.trim()}
            className="rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
            onClick={() => void createBundle()}
          >
            {bundleBusy ? "Generating…" : "Generate bundle"}
          </button>
        </div>

        {bundleResult && typeof bundleResult.bundle === "object" && bundleResult.bundle !== null ? (
          <div className="max-w-2xl rounded-xl border border-[#D4AF37]/30 bg-black/50 p-5">
            {(() => {
              const b = bundleResult.bundle as {
                bundleNumber?: string;
                status?: string;
                items?: unknown[];
              };
              return (
                <>
                  <div className="font-semibold text-white">{b.bundleNumber}</div>
                  <div className="mt-2 text-sm text-white/50">Status: {b.status}</div>
                  <div className="text-sm text-white/50">Items: {b.items?.length ?? 0}</div>
                </>
              );
            })()}
          </div>
        ) : bundleResult ? (
          <pre className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs text-white/80">
            {JSON.stringify(bundleResult, null, 2)}
          </pre>
        ) : null}
      </section>

      <section className="space-y-4 border-t border-white/10 pt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">Inspection session (read-only token)</h2>
        <p className="max-w-2xl text-sm text-white/55">
          Mint a session token for internal or external reviewers. Mutating API calls that include{" "}
          <code className="text-[#D4AF37]">x-inspection-session</code> with a read-only session are rejected.
        </p>
        <div className="grid max-w-2xl gap-3">
          <select
            className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
            value={reviewerType}
            onChange={(e) => setReviewerType(e.target.value)}
          >
            <option value="internal">Internal</option>
            <option value="agency_admin">Agency admin</option>
            <option value="regulator">Regulator</option>
            <option value="oversight">Oversight</option>
          </select>
          <select
            className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
            value={scopeType}
            onChange={(e) => setScopeType(e.target.value)}
          >
            <option value="listing">Listing</option>
            <option value="broker">Broker</option>
            <option value="complaint">Complaint</option>
            <option value="date_range">Date range</option>
            <option value="full_owner">Full owner</option>
          </select>
          <input
            className="rounded-lg border border-white/15 bg-black/50 p-3 text-white"
            placeholder="Scope ID (optional)"
            value={scopeId}
            onChange={(e) => setScopeId(e.target.value)}
          />
          <button
            type="button"
            disabled={!ownerId.trim()}
            className="rounded-lg border border-[#D4AF37]/50 px-4 py-3 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:opacity-50"
            onClick={() => void startInspectionSession()}
          >
            Start inspection session
          </button>
        </div>
        {sessionResult ? (
          <pre className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs text-white/80">
            {JSON.stringify(sessionResult, null, 2)}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
