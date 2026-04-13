"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BillingProfileForm(props: {
  tenantId: string;
  initial: {
    legalName: string | null;
    billingEmail: string | null;
    taxNumber: string | null;
    addressData: unknown;
  } | null;
}) {
  const router = useRouter();
  const [legalName, setLegalName] = useState(props.initial?.legalName ?? "");
  const [billingEmail, setBillingEmail] = useState(props.initial?.billingEmail ?? "");
  const [taxNumber, setTaxNumber] = useState(props.initial?.taxNumber ?? "");
  const [addressJson, setAddressJson] = useState(
    props.initial?.addressData
      ? JSON.stringify(props.initial.addressData, null, 2)
      : "{\n  \"line1\": \"\",\n  \"city\": \"\",\n  \"region\": \"\",\n  \"postal\": \"\"\n}"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    let addressData: unknown;
    try {
      addressData = JSON.parse(addressJson);
    } catch {
      setError("Address must be valid JSON");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch(`/api/tenants/${props.tenantId}/billing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName: legalName.trim() || null,
          billingEmail: billingEmail.trim() || null,
          taxNumber: taxNumber.trim() || null,
          addressData,
        }),
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.error === "string" ? j.error : "Save failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded border border-white/10 bg-black/20 p-4">
      <h2 className="text-lg font-medium text-slate-100">Billing profile (agency)</h2>
      <p className="text-sm text-slate-500">
        Used for future SaaS subscription billing and platform fees. Not a live payment method.
      </p>
      <div>
        <label className="text-xs text-slate-500">Legal name</label>
        <input
          className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-slate-500">Billing email</label>
        <input
          type="email"
          className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
          value={billingEmail}
          onChange={(e) => setBillingEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-slate-500">Tax number (optional)</label>
        <input
          className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
          value={taxNumber}
          onChange={(e) => setTaxNumber(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-slate-500">Address (JSON)</label>
        <textarea
          className="mt-1 w-full min-h-[100px] rounded border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs"
          value={addressJson}
          onChange={(e) => setAddressJson(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-white/10 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-40"
      >
        Save billing profile
      </button>
    </form>
  );
}
