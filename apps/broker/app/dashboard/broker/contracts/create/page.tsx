"use client";

import { useState } from "react";
import Link from "next/link";

export default function CreateContractPage() {
  const [type, setType] = useState("purchase");
  const [clauses, setClauses] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function addClause() {
    setClauses([...clauses, ""]);
  }

  function updateClause(index: number, value: string) {
    const updated = [...clauses];
    updated[index] = value;
    setClauses(updated);
  }

  async function validate() {
    setBusy(true);
    setErrors([]);
    try {
      const res = await fetch("/api/contracts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clauses }),
      });
      const data = (await res.json()) as { errors?: string[] };
      setErrors(Array.isArray(data.errors) ? data.errors : []);
    } catch {
      setErrors(["Request failed"]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#070707] p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#D4AF37]">Create Contract</h1>
        <Link href="/dashboard/broker/forms/draft" className="text-sm text-emerald-400 hover:underline">
          AI draft scaffold →
        </Link>
      </div>

      <div className="text-xs text-red-400">
        AI-generated or manually entered clauses must be reviewed by a licensed broker before use. This builder does not
        replace OACIQ forms where required.
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/70" htmlFor="contract-type">
          Contract type
        </label>
        <select
          id="contract-type"
          className="border border-white/15 bg-black p-2 text-white"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="purchase">Promise to Purchase</option>
          <option value="brokerage">Brokerage Contract</option>
        </select>
      </div>

      <div className="space-y-3">
        <h2 className="text-white">Clauses</h2>
        <p className="text-xs text-white/45">
          Future: clause library, auto-suggestions, and AI clause generation will replace manual entry.
        </p>

        {clauses.map((c, i) => (
          <input
            key={i}
            value={c}
            onChange={(e) => updateClause(i, e.target.value)}
            className="w-full border border-white/15 bg-black p-2 text-white"
            placeholder="Enter clause (include an obligation with “must” and a numeric deadline)…"
          />
        ))}

        <button type="button" onClick={addClause} className="bg-[#D4AF37] px-3 py-1 text-black">
          Add Clause
        </button>
      </div>

      <button
        type="button"
        onClick={() => void validate()}
        disabled={busy}
        className="bg-green-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Validating…" : "Validate Contract"}
      </button>

      {errors.length > 0 ? (
        <div className="bg-red-900/80 p-3 text-sm text-red-50">
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
