"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { PROPERTY_DOCUMENT_TYPE_KEYS, type PropertyDocumentTypeKey } from "@/lib/syria/property-document-types";
import { MAX_PROPERTY_PROOF_DOCUMENTS } from "@/lib/syria/photo-upload";

export type ListingProofDoc = { type: PropertyDocumentTypeKey; url: string };

type Props = {
  value: ListingProofDoc[];
  onChange: (next: ListingProofDoc[]) => void;
  disabled?: boolean;
  onUploadError: (message: string) => void;
};

/**
 * ORDER SYBNB-100 — optional deed/proof uploads (Cloudinary); URLs stay server-side except during posting.
 */
export function ListingProofDocumentsFields({ value, onChange, disabled, onUploadError }: Props) {
  const t = useTranslations("QuickPost");
  const uid = useId();
  const [pendingType, setPendingType] = useState<PropertyDocumentTypeKey>(PROPERTY_DOCUMENT_TYPE_KEYS[0]);
  const [uploading, setUploading] = useState(false);
  const [fileReset, setFileReset] = useState(0);

  async function onPickFile(file: File | null) {
    if (!file || disabled || uploading) return;
    if (value.length >= MAX_PROPERTY_PROOF_DOCUMENTS) {
      onUploadError(t("proofDocsMaxReached"));
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/listings/upload-proof-document", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
      if (res.status === 401) {
        onUploadError(t("proofDocsAuthRequired"));
        return;
      }
      if (!res.ok || !data.ok || typeof data.url !== "string") {
        if (data.error === "unsupported_type") {
          onUploadError(t("proofDocsUnsupportedType"));
        } else if (data.error === "file_too_large") {
          onUploadError(t("proofDocsFileTooLarge"));
        } else {
          onUploadError(t("proofDocsUploadFailed"));
        }
        return;
      }
      onChange([...value, { type: pendingType, url: data.url }]);
      setFileReset((n) => n + 1);
    } catch {
      onUploadError(t("proofDocsUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)]/35 p-4 [dir=rtl]:text-right">
      <div>
        <p className="text-sm font-semibold text-[color:var(--darlink-text)]">{t("proofDocsSectionTitle")}</p>
        <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">{t("proofDocsSectionSubtitle")}</p>
      </div>

      {value.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {value.map((row, i) => (
            <li
              key={`${row.url}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2"
            >
              <span className="font-medium text-[color:var(--darlink-text)]">{t(`docType_${row.type}` as Parameters<typeof t>[0])}</span>
              <button
                type="button"
                disabled={disabled || uploading}
                className="text-xs font-semibold text-rose-700 underline disabled:opacity-50"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                {t("proofDocsRemove")}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {value.length < MAX_PROPERTY_PROOF_DOCUMENTS ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block min-w-[200px] flex-1 text-xs font-medium text-[color:var(--darlink-text)]">
            {t("proofDocsTypeLabel")}
            <select
              value={pendingType}
              disabled={disabled || uploading}
              onChange={(e) => setPendingType(e.target.value as PropertyDocumentTypeKey)}
              className="mt-1 w-full min-h-10 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-2 py-2 text-sm text-[color:var(--darlink-text)]"
            >
              {PROPERTY_DOCUMENT_TYPE_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(`docType_${k}` as Parameters<typeof t>[0])}
                </option>
              ))}
            </select>
          </label>
          <label className="block flex-1 text-xs font-medium text-[color:var(--darlink-text)]">
            {t("proofDocsFileLabel")}
            <input
              key={`${uid}-${fileReset}`}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
              disabled={disabled || uploading}
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-xs text-[color:var(--darlink-text)] file:me-2 file:rounded-[var(--darlink-radius-lg)] file:border-0 file:bg-[color:var(--darlink-surface-muted)] file:px-2 file:py-1.5 file:text-[11px] file:font-medium"
            />
          </label>
        </div>
      ) : null}

      {uploading ? <p className="text-xs font-medium text-[color:var(--darlink-accent)]">{t("proofDocsUploading")}</p> : null}
      <p className="text-[11px] leading-relaxed text-[color:var(--darlink-text-muted)]">{t("proofDocsPrivacyNote")}</p>
    </div>
  );
}
