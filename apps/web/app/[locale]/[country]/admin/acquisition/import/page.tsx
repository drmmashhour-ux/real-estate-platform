"use client";

import Link from "next/link";
import { useState } from "react";

const SAMPLE = `contactName,contactEmail,city,propertyCategory,sourceType,contactPhone,description,priceCents,bedrooms,bathrooms,permissionConfirmed,sourcePlatformText
Jane Owner,jane@example.com,Montreal,Condo,OWNER,+15145550111,"Original short description in submitter words",44990000,2,2,yes,Referral`;

export default function AcquisitionImportPage() {
  const [csvText, setCsvText] = useState(SAMPLE);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/admin/listing-acquisition/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Import failed");
      setResult(`Created ${data.created} rows. ${data.errors?.length ? JSON.stringify(data.errors) : ""}`);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/acquisition" className="text-sm text-[#D4AF37] hover:underline">
          ← Acquisition
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-[#D4AF37]">CSV import (restricted)</h1>
        <p className="mt-2 text-sm text-white/60">
          Only for spreadsheets provided by owners, brokers, or hosts who attest they have rights to the data. Imports
          create <strong className="text-white/80">NEW</strong> leads in draft review — never auto-published. Avoid commas
          inside fields or use careful quoting.
        </p>
        <p className="mt-2 font-mono text-xs text-white/45">
          Required columns: contactName, contactEmail, city, propertyCategory, sourceType (OWNER|BROKER|HOST|MANUAL)
        </p>
        <form onSubmit={run} className="mt-6 space-y-4">
          <textarea
            className="h-64 w-full rounded border border-white/15 bg-black/50 p-3 font-mono text-xs text-white"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
          {result ? <p className="text-sm text-white/70">{result}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            {loading ? "Importing…" : "Import to leads"}
          </button>
        </form>
      </div>
    </div>
  );
}
