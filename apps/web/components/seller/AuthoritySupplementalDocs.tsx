"use client";

import { useState } from "react";
import type { AuthoritySupplementalDoc, AuthoritySupplementalDocKind } from "@/lib/fsbo/seller-declaration-schema";

const KINDS: { value: AuthoritySupplementalDocKind; label: string }[] = [
  { value: "mandate_poa", label: "Mandate / power of attorney" },
  { value: "company_resolution", label: "Corporate resolution / company register excerpt" },
  { value: "professional_license", label: "Lawyer or notary — professional ID / society" },
  { value: "other", label: "Other supporting document" },
];

type Props = {
  listingId: string | null;
  docs: AuthoritySupplementalDoc[];
  onChange: (next: AuthoritySupplementalDoc[]) => void;
  fieldError?: string;
};

function newDocId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `auth-doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AuthoritySupplementalDocs({ listingId, docs, onChange, fieldError }: Props) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  function addRow() {
    onChange([...docs, { id: newDocId(), kind: "other", fileUrl: null }]);
  }

  function removeRow(id: string) {
    onChange(docs.filter((d) => d.id !== id));
  }

  function patchRow(id: string, partial: Partial<AuthoritySupplementalDoc>) {
    onChange(docs.map((d) => (d.id === id ? { ...d, ...partial } : d)));
  }

  async function onFile(doc: AuthoritySupplementalDoc, file: File) {
    if (!listingId) return;
    setUploadingId(doc.id);
    setUploadErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("docId", doc.id);
      const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(listingId)}/authority-supplemental-upload`, {
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
        patchRow(doc.id, { fileUrl: data.url });
      }
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {docs.length === 0 ? (
        <p className="text-xs text-slate-500">Add at least one document using the button below.</p>
      ) : (
        <ul className="space-y-3">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className={`rounded-lg border bg-black/25 p-3 ${fieldError ? "border-red-500/45" : "border-white/10"}`}
            >
              <div className="flex flex-wrap items-end gap-2">
                <label className="min-w-[200px] flex-1 text-sm text-slate-300">
                  Document type
                  <select
                    value={doc.kind}
                    onChange={(e) => patchRow(doc.id, { kind: e.target.value as AuthoritySupplementalDocKind })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                  >
                    {KINDS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {doc.fileUrl ? (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-premium-gold hover:underline"
                    >
                      View file
                    </a>
                  ) : null}
                  <label className="cursor-pointer rounded-lg border border-white/20 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/5">
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={!listingId || uploadingId === doc.id}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void onFile(doc, f);
                      }}
                    />
                    {uploadingId === doc.id ? "Uploading…" : doc.fileUrl ? "Replace" : "Upload"}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeRow(doc.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {uploadErr ? <p className="text-xs text-red-400">{uploadErr}</p> : null}
      {fieldError ? <p className="text-xs text-red-400">{fieldError}</p> : null}
      <button
        type="button"
        onClick={addRow}
        className="rounded-lg border border-dashed border-premium-gold/40 px-4 py-2 text-sm font-medium text-premium-gold hover:bg-premium-gold/10"
      >
        + Add document
      </button>
      {!listingId ? (
        <p className="text-xs text-amber-300/90">Save your listing draft first to enable secure upload.</p>
      ) : null}
    </div>
  );
}
