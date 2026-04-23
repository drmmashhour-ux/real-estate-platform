"use client";

import { useState } from "react";
import Link from "next/link";

export default function BrokerContractDraftPage() {
  const [listingId, setListingId] = useState("temp-id");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/draft-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listingId.trim() || "temp-id",
          brokerInput: input,
        }),
      });
      const data = (await res.json()) as { draft?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        setOutput("");
        return;
      }
      setOutput(typeof data.draft === "string" ? data.draft : "");
    } catch {
      setError("Network error");
      setOutput("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#070707] p-6 text-white">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-[#D4AF37]">AI contract draft (assistant)</h1>
        <p className="mt-1 text-sm text-white/60">
          Structured prompt scaffold from listing, seller declaration, and clause placeholders — replace stub data with
          database reads when ready.
        </p>
      </div>

      <div className="text-xs text-red-400">
        AI-generated draft must be reviewed and approved by the broker. This tool does not provide legal advice or a
        final contract.
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-white/70" htmlFor="listing-id">
          Listing ID
        </label>
        <input
          id="listing-id"
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black p-2 text-white"
          placeholder="Listing id"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-white/70" htmlFor="broker-notes">
          Broker notes
        </label>
        <textarea
          id="broker-notes"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[120px] w-full rounded-lg border border-white/15 bg-black p-2 text-white"
          placeholder="Conditions, parties, dates, special instructions…"
        />
      </div>

      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={busy}
        className="rounded-lg bg-[#D4AF37] px-4 py-2.5 font-semibold text-black disabled:opacity-50"
      >
        {busy ? "Generating…" : "Generate draft scaffold"}
      </button>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {output ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white/80">Output (prompt / draft placeholder)</h2>
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/60 p-4 text-xs text-white/90">
            {output}
          </pre>
        </div>
      ) : null}

      <p className="text-sm text-white/50">
        <Link href="/dashboard/broker/contracts/create" className="text-[#D4AF37] hover:underline">
          Open contract builder (clauses + validation) →
        </Link>
      </p>
    </div>
  );
}
