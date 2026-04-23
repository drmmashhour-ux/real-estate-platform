"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Profile = { id: string; trustAccountEnabled: boolean; accountStatus: string; ownerType: string };

export default function CreateTrustDepositPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [trustAccountProfileId, setTrustAccountProfileId] = useState("");
  const [depositType, setDepositType] = useState("earnest_money");
  const [contextType, setContextType] = useState("sale");
  const [amount, setAmount] = useState("");
  const [releaseRuleType, setReleaseRuleType] = useState("written_instruction");
  const [releaseRuleText, setReleaseRuleText] = useState("");
  const [offerId, setOfferId] = useState("");
  const [listingId, setListingId] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      try {
        const res = await fetch("/api/trust/account-profile", { credentials: "same-origin" });
        const data = (await res.json()) as { success?: boolean; profiles?: Profile[]; error?: string };
        if (cancelled) return;
        if (!res.ok || !data.success || !data.profiles) {
          setLoadError(data.error ?? "Could not load trust profiles");
          setProfiles([]);
          return;
        }
        const plist = data.profiles;
        setProfiles(plist);
        setTrustAccountProfileId((cur) => cur || plist[0]?.id || "");
      } catch {
        if (!cancelled) {
          setLoadError("Network error");
          setProfiles([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    const res = await fetch("/api/trust/deposits/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        trustAccountProfileId,
        agencyId: agencyId.trim() || null,
        offerId: offerId.trim() || null,
        listingId: listingId.trim() || null,
        amountCents: Math.round(Number(amount) * 100),
        depositType,
        contextType,
        releaseRuleType,
        releaseRuleText,
      }),
    });

    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!data.success) {
      alert(data.error ?? "Error");
      return;
    }

    alert("Deposit recorded");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#D4AF37]">Record Trust Deposit</h1>
        <Link href="/dashboard/broker/trust" className="text-sm text-gray-400 underline">
          Back to Trust Center
        </Link>
      </div>

      {loadError ? <p className="text-sm text-amber-400">{loadError}</p> : null}

      {profiles.length === 0 ? (
        <p className="text-sm text-gray-400 max-w-2xl">
          No trust account profile found for your account. An administrator must register a trust profile (solo broker or
          agency) and enable trust handling before deposits can be recorded.
        </p>
      ) : null}

      <div className="grid gap-4 max-w-2xl">
        <label className="text-xs text-gray-500 uppercase tracking-wide">Trust account profile</label>
        <select
          className="bg-black text-white border border-gray-700 p-3"
          value={trustAccountProfileId}
          onChange={(e) => setTrustAccountProfileId(e.target.value)}
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id.slice(0, 8)}… · {p.ownerType} · {p.accountStatus}{" "}
              {p.trustAccountEnabled ? "(enabled)" : "(disabled)"}
            </option>
          ))}
        </select>

        <label className="text-xs text-gray-500 uppercase tracking-wide">Agency id (required for agency profiles)</label>
        <input
          className="bg-black text-white border border-gray-700 p-3"
          placeholder="Organization / agency owner id"
          value={agencyId}
          onChange={(e) => setAgencyId(e.target.value)}
        />

        <label className="text-xs text-gray-500 uppercase tracking-wide">Optional links</label>
        <input
          className="bg-black text-white border border-gray-700 p-3"
          placeholder="Listing id"
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
        />
        <input
          className="bg-black text-white border border-gray-700 p-3"
          placeholder="Offer id"
          value={offerId}
          onChange={(e) => setOfferId(e.target.value)}
        />

        <select
          className="bg-black text-white border border-gray-700 p-3"
          value={depositType}
          onChange={(e) => setDepositType(e.target.value)}
        >
          <option value="earnest_money">Earnest money</option>
          <option value="security_deposit_vacation_resort">Vacation resort security deposit</option>
          <option value="other_trust_funds">Other trust funds</option>
        </select>

        <select
          className="bg-black text-white border border-gray-700 p-3"
          value={contextType}
          onChange={(e) => setContextType(e.target.value)}
        >
          <option value="sale">Sale</option>
          <option value="purchase">Purchase</option>
          <option value="lease_vacation_resort">Lease - vacation resort</option>
          <option value="other">Other</option>
        </select>

        <input
          className="bg-black text-white border border-gray-700 p-3"
          placeholder="Amount (CAD)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          className="bg-black text-white border border-gray-700 p-3"
          value={releaseRuleType}
          onChange={(e) => setReleaseRuleType(e.target.value)}
        >
          <option value="written_instruction">Written instruction</option>
          <option value="contract_condition_met">Contract condition met</option>
          <option value="court_order">Court order</option>
          <option value="lease_end_inspection">Lease end inspection</option>
          <option value="manual_compliance_review">Manual compliance review</option>
        </select>

        <textarea
          className="bg-black text-white border border-gray-700 p-3 min-h-[140px]"
          placeholder="Describe the release / refund conditions (required for vacation resort security deposits)"
          value={releaseRuleText}
          onChange={(e) => setReleaseRuleText(e.target.value)}
        />

        <div className="text-xs text-gray-400">
          This tool records and tracks trust handling. Any release, refund, or dispute resolution must remain subject to
          broker / agency compliance review where required. AI may assist with wording only — never final entitlement or
          fund movement decisions.
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!trustAccountProfileId || profiles.length === 0}
          className="px-4 py-3 bg-[#D4AF37] text-black font-semibold disabled:opacity-50"
        >
          Save deposit
        </button>
      </div>
    </div>
  );
}
