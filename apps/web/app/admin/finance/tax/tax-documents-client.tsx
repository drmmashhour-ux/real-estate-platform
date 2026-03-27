"use client";

import { useState } from "react";

const DOC_TYPES = [
  { value: "PLATFORM_REVENUE_SUMMARY", label: "Platform revenue summary (internal)" },
  { value: "MONTHLY_PLATFORM_REPORT", label: "Monthly platform report (internal)" },
  { value: "ANNUAL_EARNINGS_SUMMARY", label: "Annual earnings summary (internal)" },
  { value: "ANNUAL_EARNINGS_SLIP", label: "Annual earnings summary — legacy type key" },
  { value: "BROKER_COMMISSION_SUMMARY", label: "Commission summary (internal)" },
  { value: "BROKER_COMMISSION_SLIP", label: "Commission summary — legacy type key" },
  { value: "BROKER_PAYOUT_SUMMARY", label: "Broker payout summary (manual batches)" },
  { value: "TAX_SUMMARY", label: "Generic tax summary (internal)" },
  { value: "COMMISSION_REPORT", label: "Commission report" },
];

export function TaxDocumentsClient() {
  const [documentType, setDocumentType] = useState("PLATFORM_REVENUE_SUMMARY");
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState<number | "">("");
  const [subjectUserId, setSubjectUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/finance/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          periodYear,
          periodMonth: periodMonth === "" ? null : periodMonth,
          subjectUserId: subjectUserId.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMessage(`Created document ${data.document?.id}. Refresh to see in list.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={generate} className="card-premium mt-6 space-y-4 p-6">
      <h2 className="text-sm font-semibold text-slate-200">Generate document</h2>
      <div>
        <label className="block text-xs text-slate-500">Type</label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="input-premium mt-1"
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-slate-500">Year</label>
          <input
            type="number"
            value={periodYear}
            onChange={(e) => setPeriodYear(Number(e.target.value))}
            className="input-premium mt-1 w-28"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Month (optional)</label>
          <input
            type="number"
            min={1}
            max={12}
            placeholder="1–12"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value === "" ? "" : Number(e.target.value))}
            className="input-premium mt-1 w-28"
          />
        </div>
      </div>
      {(documentType === "ANNUAL_EARNINGS_SLIP" ||
        documentType === "ANNUAL_EARNINGS_SUMMARY" ||
        documentType === "BROKER_COMMISSION_SLIP" ||
        documentType === "BROKER_COMMISSION_SUMMARY" ||
        documentType === "BROKER_PAYOUT_SUMMARY") && (
        <div>
          <label className="block text-xs text-slate-500">Subject user / broker ID</label>
          <input
            value={subjectUserId}
            onChange={(e) => setSubjectUserId(e.target.value)}
            placeholder="UUID of user or broker"
            className="input-premium mt-1"
          />
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Generating…" : "Generate"}
      </button>
      {message && <p className="text-sm text-slate-400">{message}</p>}
    </form>
  );
}
