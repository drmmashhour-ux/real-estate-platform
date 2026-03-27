"use client";

import { useEffect, useState } from "react";
import { TAX_DISCLAIMER } from "@/lib/tax/quebec-broker-tax";

type Reg = {
  legalName: string;
  businessName: string | null;
  businessNumberNine: string;
  gstNumber: string | null;
  qstNumber: string | null;
  businessAddress: string;
  province: string;
  status: string;
  adminNotes: string | null;
  reviewedAt: string | null;
};

const PROVINCES = ["QC", "ON", "BC", "AB", "MB", "SK", "NB", "NS", "PE", "NL", "NT", "NU", "YT"];

export function BrokerTaxForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reg, setReg] = useState<Reg | null>(null);
  const [notSubmitted, setNotSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const [legalName, setLegalName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessNumberNine, setBusinessNumberNine] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [qstNumber, setQstNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [province, setProvince] = useState("QC");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/broker/tax-registration", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (data.notSubmitted) {
        setNotSubmitted(true);
      } else if (data.registration) {
        const r = data.registration as Reg;
        setReg(r);
        setLegalName(r.legalName);
        setBusinessName(r.businessName ?? "");
        setBusinessNumberNine(r.businessNumberNine);
        setGstNumber(r.gstNumber ?? "");
        setQstNumber(r.qstNumber ?? "");
        setBusinessAddress(r.businessAddress);
        setProvince(r.province || "QC");
        setNotSubmitted(false);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);
    const res = await fetch("/api/broker/tax-registration", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalName,
        businessName: businessName.trim() || null,
        businessNumberNine,
        gstNumber: gstNumber.trim() || null,
        qstNumber: qstNumber.trim() || null,
        businessAddress,
        province,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErrors(data.errors ?? { _form: data.error ?? "Save failed" });
      return;
    }
    setReg(data.registration);
    setNotSubmitted(false);
    setMessage("Saved. Your filing is marked Submitted for internal review (not verified with Revenu Québec).");
  }

  const statusLabel =
    reg?.status === "APPROVED"
      ? "Approved (manual internal review)"
      : reg?.status === "REJECTED"
        ? "Rejected — update and resubmit"
        : reg?.status === "SUBMITTED"
          ? "Submitted — pending review"
          : notSubmitted
            ? "Not submitted"
            : "—";

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100/90">
        <p className="font-medium text-amber-200">Important</p>
        <p className="mt-1">{TAX_DISCLAIMER}</p>
        <p className="mt-2 text-xs text-amber-200/80">
          We only check the format of your numbers. We do <strong>not</strong> connect to Revenu Québec or the CRA for verification.
        </p>
      </div>

      <p className="text-sm text-slate-400">
        Status: <span className="text-slate-200">{statusLabel}</span>
      </p>
      {reg?.adminNotes && reg.status === "REJECTED" && (
        <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-3 text-sm text-rose-100">
          <p className="font-medium">Notes from review</p>
          <p className="mt-1 whitespace-pre-wrap">{reg.adminNotes}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-400">Legal name (as registered)</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            required
          />
          {errors.legalName && <p className="mt-1 text-xs text-rose-400">{errors.legalName}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Business name (if applicable)</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Business number (BN) — 9 digits</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-slate-100"
            value={businessNumberNine}
            onChange={(e) => setBusinessNumberNine(e.target.value.replace(/\D/g, "").slice(0, 9))}
            placeholder="123456789"
            inputMode="numeric"
          />
          {errors.businessNumberNine && <p className="mt-1 text-xs text-rose-400">{errors.businessNumberNine}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">GST number (optional, format 123456789RT0001)</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            placeholder="123456789RT0001"
          />
          {errors.gstNumber && <p className="mt-1 text-xs text-rose-400">{errors.gstNumber}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">
            QST number (required if province is Quebec — format 1234567890TQ0001)
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100"
            value={qstNumber}
            onChange={(e) => setQstNumber(e.target.value)}
            placeholder="1234567890TQ0001"
          />
          {errors.qstNumber && <p className="mt-1 text-xs text-rose-400">{errors.qstNumber}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Business address</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            rows={3}
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            required
          />
          {errors.businessAddress && <p className="mt-1 text-xs text-rose-400">{errors.businessAddress}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Province / territory</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          >
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        {errors._form && <p className="text-sm text-rose-400">{errors._form}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save tax information"}
        </button>
      </form>
    </div>
  );
}
