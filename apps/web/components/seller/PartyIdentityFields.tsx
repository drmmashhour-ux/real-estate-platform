"use client";

import { useState } from "react";
import type { IdDocumentType, PartyIdentity } from "@/lib/fsbo/seller-declaration-schema";
import { checkQuebecDriverLicenseDob } from "@/lib/fsbo/qc-driver-license-dob";
import { WritingCorrectionButton } from "@/components/ui/WritingCorrectionButton";

function stripChecks(): Pick<PartyIdentity, "idAiCheck" | "idDetailsConfirmed"> {
  return { idAiCheck: null, idDetailsConfirmed: false };
}

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
  fieldErrors?: { idNumber?: string; phone?: string; email?: string; idDetailsConfirmed?: string };
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
  const [aiVerifying, setAiVerifying] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);

  async function runAiVerify(snapshot: PartyIdentity) {
    if (!listingId || !snapshot.idDocumentUrl?.trim() || !snapshot.idType) {
      return;
    }
    setAiVerifying(true);
    setAiErr(null);
    try {
      const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(listingId)}/party-id-ai-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          partyId: snapshot.id,
          idDocumentUrl: snapshot.idDocumentUrl,
          idType: snapshot.idType,
          idNumber: snapshot.idNumber ?? "",
          fullName: snapshot.fullName ?? "",
          dateOfBirth: snapshot.dateOfBirth ?? "",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        idAiCheck?: PartyIdentity["idAiCheck"];
        error?: string;
      };
      if (data.idAiCheck && typeof data.idAiCheck === "object") {
        onChange({ ...snapshot, idAiCheck: data.idAiCheck });
        setAiErr(null);
        return;
      }
      if (!res.ok) {
        setAiErr(
          typeof data.error === "string"
            ? data.error
            : "We couldn’t verify this file. Upload a clear photo of your government-issued ID and try again.",
        );
        return;
      }
    } catch {
      setAiErr("Connection problem — check your network and try again.");
    } finally {
      setAiVerifying(false);
    }
  }

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
        const next: PartyIdentity = {
          ...party,
          idDocumentUrl: data.url,
          idDocumentVerificationStatus: "pending",
          ...stripChecks(),
        };
        onChange(next);
        if (next.idType) {
          void runAiVerify(next);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">{label}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-slate-300 sm:col-span-2">
          ID type
          <select
            value={party.idType}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...party,
                idType: e.target.value as IdDocumentType | "",
                ...stripChecks(),
              })
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
            onChange={(e) => onChange({ ...party, idNumber: e.target.value, ...stripChecks() })}
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
            onChange={(e) => onChange({ ...party, fullName: e.target.value, ...stripChecks() })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Date of birth
          <input
            type="date"
            value={party.dateOfBirth}
            disabled={disabled}
            onChange={(e) => onChange({ ...party, dateOfBirth: e.target.value, ...stripChecks() })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        {(() => {
          const qc = checkQuebecDriverLicenseDob(party.idType, party.idNumber, party.dateOfBirth);
          if (!qc.show) return null;
          const box =
            qc.variant === "match"
              ? "border-emerald-500/35 bg-emerald-950/20 text-emerald-100/95"
              : qc.variant === "mismatch"
                ? "border-red-500/40 bg-red-950/20 text-red-100/95"
                : "border-white/10 bg-white/[0.03] text-slate-300";
          return (
            <div className={`rounded-lg border px-3 py-2 text-xs leading-snug sm:col-span-2 ${box}`}>
              <p className="font-semibold text-slate-200/95">Québec driver's licence — date in the number</p>
              <p className="mt-1">{qc.message}</p>
            </div>
          );
        })()}
        <label className="block text-sm text-slate-300">
          <span className="mb-1 flex flex-wrap items-end justify-between gap-2">
            <span>Occupation / job</span>
            <WritingCorrectionButton
              text={party.occupation}
              onApply={(v) => onChange({ ...party, occupation: v })}
              disabled={disabled}
              className="shrink-0"
            />
          </span>
          <input
            value={party.occupation}
            disabled={disabled}
            onChange={(e) => onChange({ ...party, occupation: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
            autoComplete="organization-title"
          />
        </label>
        <label className="block text-sm text-slate-300">
          <span className="mb-1 flex flex-wrap items-end justify-between gap-2">
            <span>Annual income (approx.)</span>
            <WritingCorrectionButton
              text={party.annualIncome}
              onApply={(v) => onChange({ ...party, annualIncome: v })}
              disabled={disabled}
              className="shrink-0"
            />
          </span>
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
        <p className="text-xs font-medium text-slate-400">Government-issued ID — photo or scan</p>
        <p className="mt-1 text-xs text-slate-500">
          Upload a clear photo of your actual ID (passport, driver&apos;s licence, or national ID). Food, screenshots, or
          unrelated pictures cannot be verified. JPG/PNG/WebP work best for AI; PDFs are limited. Max 12 MB.
        </p>
        {!listingId ? (
          <p className="mt-2 text-xs text-amber-300/90">Save your listing draft first to enable secure upload.</p>
        ) : (
          <>
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/[0.02] px-4 py-8 transition hover:border-premium-gold/40 hover:bg-white/[0.04]">
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                disabled={disabled || uploading}
                onChange={(e) => void onFile(e)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-slate-200">Drop a file here or click to upload</span>
              <span className="mt-1 text-xs text-slate-500">PDF, JPG, PNG, or WebP — max 12 MB</span>
            </label>
            {uploading ? <p className="mt-2 text-xs text-slate-500">Uploading…</p> : null}
            {uploadErr ? <p className="mt-2 text-xs text-red-400">{uploadErr}</p> : null}
            {party.idDocumentUrl ? (
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={party.idDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-premium-gold hover:underline"
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
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      disabled ||
                      aiVerifying ||
                      !party.idType ||
                      !party.idDocumentUrl?.trim()
                    }
                    onClick={() => void runAiVerify(party)}
                    className="rounded-lg border border-premium-gold/40 bg-premium-gold/10 px-3 py-1.5 text-xs font-medium text-premium-gold transition hover:bg-premium-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aiVerifying ? "Checking with AI…" : "Verify with AI"}
                  </button>
                  {aiErr ? (
                    <p className="max-w-sm text-xs leading-snug text-red-300/95">{aiErr}</p>
                  ) : null}
                </div>
                {party.idAiCheck ? (
                  <div
                    className={`rounded-lg border px-3 py-2 text-sm leading-snug ${
                      party.idAiCheck.status === "match"
                        ? "border-emerald-500/40 bg-emerald-950/25 text-emerald-100/95"
                        : party.idAiCheck.status === "mismatch"
                          ? "border-red-500/45 bg-red-950/25 text-red-100/95"
                          : "border-amber-500/35 bg-amber-950/20 text-amber-100/90"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400/90">
                      AI check —{" "}
                      {party.idAiCheck.status === "match"
                        ? "Likely match"
                        : party.idAiCheck.status === "mismatch"
                          ? "Possible mismatch"
                          : "Inconclusive"}
                    </p>
                    <p className="mt-1 text-xs">{party.idAiCheck.message}</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {new Date(party.idAiCheck.checkedAt).toLocaleString()}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Required to complete this section.</p>
            )}
          </>
        )}
        <label
          className={`mt-4 flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm leading-snug ${
            fieldErrors?.idDetailsConfirmed
              ? "border-red-500/50 bg-red-950/20 text-red-100/95"
              : "border-white/10 bg-white/[0.03] text-slate-200"
          }`}
        >
          <input
            type="checkbox"
            checked={party.idDetailsConfirmed === true}
            disabled={
              disabled ||
              !listingId ||
              !party.idType ||
              !party.idNumber?.trim() ||
              !party.idDocumentUrl?.trim()
            }
            onChange={(e) => onChange({ ...party, idDetailsConfirmed: e.target.checked })}
            className="mt-0.5 rounded border-white/25"
          />
          <span>
            I confirm the ID type, ID number, and uploaded document match this person and are accurate. I understand I must
            complete this before other declaration sections can be finalized.
          </span>
        </label>
        {fieldErrors?.idDetailsConfirmed ? (
          <p className="mt-2 text-xs text-red-400">{fieldErrors.idDetailsConfirmed}</p>
        ) : null}
      </div>
    </div>
  );
}
