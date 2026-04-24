"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LEGAL_ASSISTANT_DISCLAIMER } from "@/modules/legal/legal-disclaimer";

const DOC_TYPES = [
  { id: "booking_agreement", label: "Booking agreement (short-term)" },
  { id: "rental_agreement", label: "Rental agreement (residential draft)" },
  { id: "broker_agreement", label: "Broker / cooperation (draft)" },
  { id: "cancellation_policy", label: "Cancellation policy" },
] as const;

type GenerateResponse = {
  success?: boolean;
  error?: string;
  fullDocument?: string;
  disclaimer?: string;
  hasUnresolvedPlaceholders?: boolean;
  unresolvedPlaceholderKeys?: string[];
  details?: unknown;
};

export function LegalAssistantDashboardClient() {
  const [documentType, setDocumentType] = useState<string>("booking_agreement");
  const [hostName, setHostName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [totalAmount, setTotalAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [governingLawNote, setGoverningLawNote] = useState("");
  const [includePaymentTerms, setIncludePaymentTerms] = useState(false);
  const [includeLiability, setIncludeLiability] = useState(false);
  const [strictness, setStrictness] = useState<"strict" | "moderate" | "flexible">("moderate");
  const [documentBody, setDocumentBody] = useState<string>("");
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDocumentBody("");
    setUnresolved([]);
    try {
      const parties: { role: string; legalName: string }[] = [];
      if (hostName.trim()) parties.push({ role: "host", legalName: hostName.trim() });
      if (guestName.trim()) parties.push({ role: "guest", legalName: guestName.trim() });

      const r = await fetch("/api/legal/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          parties: parties.length ? parties : undefined,
          property:
            propertyAddress.trim() || propertyCity.trim()
              ? {
                  address: propertyAddress.trim() || undefined,
                  city: propertyCity.trim() || undefined,
                }
              : undefined,
          dates: {
            effectiveDate: effectiveDate.trim() || undefined,
            checkIn: checkIn.trim() || undefined,
            checkOut: checkOut.trim() || undefined,
          },
          terms: {
            currency: currency.trim() || undefined,
            totalAmount: totalAmount.trim() || undefined,
            depositAmount: depositAmount.trim() || undefined,
            governingLawNote: governingLawNote.trim() || undefined,
            cancellationStrictness: strictness,
          },
          clauses: {
            includePaymentTerms,
            includeLiability,
          },
        }),
      });
      const j = (await r.json()) as GenerateResponse;
      if (!r.ok || !j.success) {
        setError(
          j.error === "validation_error"
            ? "Check inputs and try again."
            : j.error ?? `Request failed (${r.status})`
        );
        return;
      }
      setDocumentBody(j.fullDocument ?? "");
      setUnresolved(j.unresolvedPlaceholderKeys ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [
    documentType,
    hostName,
    guestName,
    propertyAddress,
    propertyCity,
    effectiveDate,
    checkIn,
    checkOut,
    currency,
    totalAmount,
    depositAmount,
    governingLawNote,
    includePaymentTerms,
    includeLiability,
    strictness,
  ]);

  return (
    <div className="space-y-6">
      <Card className="border border-amber-900/50 bg-amber-950/25 p-4 text-sm text-amber-100/95">
        <p className="font-medium text-amber-200">{LEGAL_ASSISTANT_DISCLAIMER}</p>
        <p className="mt-2 text-amber-100/85">
          Drafts may be incomplete. Edit every field, add required disclosures, and have qualified counsel review before
          signing or publishing.
        </p>
      </Card>

      <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Document</h2>
        <div className="mt-3 space-y-3">
          <label className="block text-sm text-zinc-400">
            Template
            <select
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              {DOC_TYPES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Host / landlord name" value={hostName} onChange={setHostName} />
            <Field label="Guest / tenant name" value={guestName} onChange={setGuestName} />
          </div>
          <Field label="Property address" value={propertyAddress} onChange={setPropertyAddress} />
          <Field label="City / region" value={propertyCity} onChange={setPropertyCity} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Agreement / effective date" value={effectiveDate} onChange={setEffectiveDate} />
            <Field label="Check-in" value={checkIn} onChange={setCheckIn} />
            <Field label="Check-out" value={checkOut} onChange={setCheckOut} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Currency" value={currency} onChange={setCurrency} />
            <Field label="Total amount" value={totalAmount} onChange={setTotalAmount} />
            <Field label="Deposit" value={depositAmount} onChange={setDepositAmount} />
          </div>
          <label className="block text-sm text-zinc-400">
            Cancellation strictness (outline)
            <select
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
              value={strictness}
              onChange={(e) => setStrictness(e.target.value as typeof strictness)}
            >
              <option value="flexible">Flexible</option>
              <option value="moderate">Moderate</option>
              <option value="strict">Strict</option>
            </select>
          </label>
          <Field
            label="Governing law (your wording — optional)"
            value={governingLawNote}
            onChange={setGoverningLawNote}
          />
          <div className="flex flex-wrap gap-4 text-sm text-zinc-300">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={includePaymentTerms}
                onChange={(e) => setIncludePaymentTerms(e.target.checked)}
              />
              Extra payment terms clause block
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={includeLiability}
                onChange={(e) => setIncludeLiability(e.target.checked)}
              />
              Extra liability outline block
            </label>
          </div>
          <Button type="button" disabled={loading} onClick={() => void generate()}>
            {loading ? "Generating…" : "Generate draft (Markdown)"}
          </Button>
        </div>
      </Card>

      {error ? (
        <Card className="border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">{error}</Card>
      ) : null}

      {documentBody ? (
        <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Editable output</h2>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(documentBody);
              }}
            >
              Copy Markdown
            </Button>
          </div>
          {unresolved.length > 0 ? (
            <p className="mt-2 text-xs text-amber-200/90">
              Remaining placeholders to complete manually: {unresolved.join(", ")}
            </p>
          ) : null}
          <textarea
            className="mt-4 h-[min(70vh,560px)] w-full resize-y rounded border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-200"
            value={documentBody}
            onChange={(e) => setDocumentBody(e.target.value)}
            aria-label="Generated draft document"
          />
          <p className="mt-3 text-xs text-zinc-500">
            Format: Markdown — edit below, then paste into Google Docs, Word, or your CMS after counsel review.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm text-zinc-400">
      {props.label}
      <input
        className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}
