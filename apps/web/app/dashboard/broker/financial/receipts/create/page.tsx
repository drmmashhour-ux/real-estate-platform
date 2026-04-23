"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CreateCashReceiptPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [adminOwnerType, setAdminOwnerType] = useState("solo_broker");
  const [adminOwnerId, setAdminOwnerId] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receivedForType, setReceivedForType] = useState("trust_deposit");
  const [receivedForLabel, setReceivedForLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [fundsDestinationOverride, setFundsDestinationOverride] = useState("");
  const [trustDepositId, setTrustDepositId] = useState("");
  const [listingId, setListingId] = useState("");
  const [offerId, setOfferId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/financial/session-context", { credentials: "same-origin" });
        const json = (await res.json()) as { success?: boolean; isAdmin?: boolean; userId?: string; error?: string };
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setLoadError(json.error ?? "Session unavailable");
          return;
        }
        setIsAdmin(!!json.isAdmin);
        setUserId(json.userId ?? null);
      } catch {
        if (!cancelled) setLoadError("Network error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    const body: Record<string, unknown> = {
      payerName,
      amountCents: Math.round(Number(amount) * 100),
      paymentMethod,
      receivedForType,
      receivedForLabel: receivedForLabel.trim() || null,
      notes,
      agencyId: agencyId.trim() || null,
      trustDepositId: trustDepositId.trim() || null,
      listingId: listingId.trim() || null,
      offerId: offerId.trim() || null,
    };

    if (fundsDestinationOverride.trim()) {
      body.fundsDestinationType = fundsDestinationOverride.trim();
    }

    if (isAdmin) {
      body.ownerType = adminOwnerType;
      body.ownerId = adminOwnerId.trim();
      body.brokerId = userId;
    }

    const res = await fetch("/api/financial/cash-receipts/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as { success?: boolean; error?: string; receipt?: { receiptNumber: string } };

    if (!data.success) {
      alert(data.error ?? "Error");
      return;
    }

    alert(`Receipt created: ${data.receipt?.receiptNumber ?? ""}`);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#D4AF37]">Create Receipt of Cash / Funds</h1>
          <p className="text-sm text-gray-400 mt-2">
            Record funds received, classify them correctly, and post to the financial register for the period.
          </p>
        </div>
        <Link href="/dashboard/broker/financial" className="text-sm text-gray-400 underline self-start">
          Back to Financial Records
        </Link>
      </div>

      {loadError ? <p className="text-sm text-amber-400">{loadError}</p> : null}

      <div className="grid gap-4 max-w-2xl">
        {isAdmin ? (
          <>
            <label className="text-xs text-gray-500 uppercase">Owner type (admin)</label>
            <select
              className="bg-black text-white border border-gray-700 p-3"
              value={adminOwnerType}
              onChange={(e) => setAdminOwnerType(e.target.value)}
            >
              <option value="solo_broker">Solo broker</option>
              <option value="agency">Agency</option>
              <option value="platform">Platform</option>
            </select>
            <input
              className="bg-black text-white border border-gray-700 p-3 font-mono"
              placeholder="Owner id (broker user id, agency id, or platform key)"
              value={adminOwnerId}
              onChange={(e) => setAdminOwnerId(e.target.value)}
            />
          </>
        ) : (
          <>
            <label className="text-xs text-gray-500 uppercase">Agency id (optional)</label>
            <input
              className="bg-black text-white border border-gray-700 p-3 font-mono text-sm"
              placeholder="If set, receipt is recorded under agency owner"
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
            />
          </>
        )}

        <input
          className="bg-black text-white border border-gray-700 p-3"
          placeholder="Payer name"
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
        />

        <input
          className="bg-black text-white border border-gray-700 p-3"
          placeholder="Amount (CAD)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          className="bg-black text-white border border-gray-700 p-3"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="card">Card</option>
          <option value="other">Other</option>
        </select>

        <select
          className="bg-black text-white border border-gray-700 p-3"
          value={receivedForType}
          onChange={(e) => setReceivedForType(e.target.value)}
        >
          <option value="trust_deposit">Trust deposit</option>
          <option value="brokerage_fee">Brokerage fee</option>
          <option value="platform_fee">Platform fee</option>
          <option value="rent">Rent</option>
          <option value="other">Other</option>
        </select>

        <input
          className="bg-black text-white border border-gray-700 p-3"
          placeholder="Purpose / label"
          value={receivedForLabel}
          onChange={(e) => setReceivedForLabel(e.target.value)}
        />

        <input
          className="bg-black text-white border border-gray-700 p-3 font-mono text-sm"
          placeholder="Optional trust deposit id link"
          value={trustDepositId}
          onChange={(e) => setTrustDepositId(e.target.value)}
        />
        <input
          className="bg-black text-white border border-gray-700 p-3 font-mono text-sm"
          placeholder="Optional listing id"
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
        />
        <input
          className="bg-black text-white border border-gray-700 p-3 font-mono text-sm"
          placeholder="Optional offer id"
          value={offerId}
          onChange={(e) => setOfferId(e.target.value)}
        />

        <label className="text-xs text-gray-500">
          Override funds destination (optional — defaults from purpose; trust deposits must stay trust)
        </label>
        <select
          className="bg-black text-white border border-gray-700 p-3"
          value={fundsDestinationOverride}
          onChange={(e) => setFundsDestinationOverride(e.target.value)}
        >
          <option value="">Auto from purpose</option>
          <option value="trust">trust</option>
          <option value="operating">operating</option>
          <option value="platform_revenue">platform_revenue</option>
          <option value="pending_review">pending_review</option>
        </select>

        <textarea
          className="bg-black text-white border border-gray-700 p-3 min-h-[120px]"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="text-xs text-gray-400">
          Funds classified as trust deposits must remain separated from operating and platform revenue. AI may summarize
          or draft wording only — not final classification or silent ledger changes.
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          className="px-4 py-3 bg-[#D4AF37] text-black font-semibold"
        >
          Save receipt
        </button>
      </div>
    </div>
  );
}
