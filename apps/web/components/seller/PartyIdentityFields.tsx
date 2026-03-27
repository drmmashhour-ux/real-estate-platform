"use client";

import { useState } from "react";
import type { IdDocumentType, PartyIdentity } from "@/lib/fsbo/seller-declaration-schema";

const ID_TYPES: { value: IdDocumentType; label: string }[] = [
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver license" },
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "OTHER", label: "Other" },
];

type Props = {
  label: string;
  party: PartyIdentity;
  onChange: (next: PartyIdentity) => void;
  listingId: string | null;
  disabled?: boolean;
  /** Inline validation (no alerts) */
  fieldErrors?: { idNumber?: string; phone?: string; email?: string };
  /** Same phone as another seller — show allow-shared checkbox */
  phoneDuplicateConflict?: boolean;
  emailDuplicateConflict?: boolean;
  onConfirmSharedPhone?: () => void;
  onConfirmSharedEmail?: () => void;
};

export function PartyIdentityFields({
  label,
  party,
  onChange,
  listingId,
  disabled,
  fieldErrors,
  phoneDuplicateConflict,
  emailDuplicateConflict,
  onConfirmSharedPhone,
  onConfirmSharedEmail,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !listingId) return;
    setUploading(true);
    setUploadErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("partyId", party.id);
      const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(listingId)}/party-id-upload`, {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) {
        setUploadErr(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      if (typeof data.url === "string") {
        onChange({
          ...party,
          idDocumentUrl: data.url,
          idDocumentVerificationStatus: "pending",
        });
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A646]">{label}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-slate-300 sm:col-span-2">
          ID type
          <select
            value={party.idType}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...party, idType: e.target.value as IdDocumentType | "" })
            }
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          >
            <option value="">Select…</option>
            {ID_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-slate-300">
          ID number
          <input
            value={party.idNumber}
            disabled={disabled}
            onChange={(e) => onChange({ ...party, idNumber: e.target.value })}
            autoComplete="off"
            className={`mt-1 w-full rounded-lg border bg-black/50 px-3 py-2 text-white ${
              fieldErrors?.idNumber ? "border-red-500/60" : "border-white/10"
            }`}
          />
          {fieldErrors?.idNumber ? <p className="mt-1 text-xs text-red-400">{fieldErrors.idNumber}</p> : null}
        </label>
        <label className="block text-sm text-slate-300">
          Full legal name
          <input
            value={party.fullName}
            disabled={disabled}
            onChange={(e) => onChange({ ...party, fullName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Date of birth
          <input
            type="date"
            value={party.dateOfBirth}
            disabled={disabled}
            onChange={(e) => onChange({ ...party, dateOfBirth: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Occupation / job
          <input
            value={party.occupation}
            disabled={disabled}
            onChange={(e) => onChange({ ...party, occupation: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Annual income (approx.)
          <input
            value={party.annualIncome}
            disabled={disabled}
            onChange={(e) => onChange({ ...party, annualIncome: e.target.value })}
            placeholder="e.g. 85000 CAD"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm text-slate-300 sm:col-span-2">
          Phone
          <input
            type="tel"
            value={party.phone}
            disabled={disabled}
            onChange={(e) => onChange({ ...party, phone: e.target.value })}
            className={`mt-1 w-full rounded-lg border bg-black/50 px-3 py-2 text-white ${
              fieldErrors?.phone ? "border-red-500/60" : "border-white/10"
            }`}
          />
          {fieldErrors?.phone ? <p className="mt-1 text-xs text-red-400">{fieldErrors.phone}</p> : null}
          {phoneDuplicateConflict ? (
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-amber-200/95">
              <input
                type="checkbox"
                checked={party.sharedContact === true}
                disabled={disabled}
                onChange={() => onConfirmSharedPhone?.()}
                className="mt-0.5 rounded border-white/20"
              />
              <span>Use same phone number for multiple sellers (intentional)</span>
            </label>
          ) : null}
        </label>
        <label className="block text-sm text-slate-300 sm:col-span-2">
          Email
          <input
            type="email"
            value={party.email}
            disabled={disabled}
            onChange={(e) => onChange({ ...party, email: e.target.value })}
            className={`mt-1 w-full rounded-lg border bg-black/50 px-3 py-2 text-white ${
              fieldErrors?.email ? "border-red-500/60" : "border-white/10"
            }`}
          />
          {fieldErrors?.email ? <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p> : null}
          {emailDuplicateConflict ? (
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-amber-200/95">
              <input
                type="checkbox"
                checked={party.sharedContact === true}
                disabled={disabled}
                onChange={() => onConfirmSharedEmail?.()}
                className="mt-0.5 rounded border-white/20"
              />
              <span>Use same email for multiple sellers (intentional)</span>
            </label>
          ) : null}
        </label>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-xs font-medium text-slate-400">Government-issued ID document</p>
        {!listingId ? (
          <p className="mt-2 text-xs text-amber-300/90">Save your listing draft first to enable secure upload.</p>
        ) : (
          <>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              disabled={disabled || uploading}
              onChange={(e) => void onFile(e)}
              className="mt-2 block text-xs text-slate-400"
            />
            {uploading ? <p className="mt-1 text-xs text-slate-500">Uploading…</p> : null}
            {uploadErr ? <p className="mt-1 text-xs text-red-400">{uploadErr}</p> : null}
            {party.idDocumentUrl ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <a
                  href={party.idDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C9A646] hover:underline"
                >
                  View uploaded file
                </a>
                <span className="rounded bg-white/10 px-2 py-0.5 text-slate-400">
                  {party.idDocumentVerificationStatus === "verified"
                    ? "Verified"
                    : party.idDocumentVerificationStatus === "pending"
                      ? "Pending review"
                      : "Uploaded"}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Required to complete this section.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
