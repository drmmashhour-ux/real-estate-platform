"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SellerSupportingDocumentCategory,
  SellerSupportingDocumentStatus,
} from "@/types/seller-supporting-doc-client";
import {
  DECLARATION_SECTION_LINK_OPTIONS,
  SELLER_DOCUMENT_CATEGORY_LABELS,
  SELLER_DOCUMENT_CATEGORIES,
} from "@/lib/seller/seller-document-types";

type DocRow = {
  id: string;
  originalFileName: string;
  mimeType: string;
  category: SellerSupportingDocumentCategory;
  status: SellerSupportingDocumentStatus;
  declarationSectionKey: string | null;
  createdAt: string;
};

function fileTypeLabel(mime: string): string {
  const m = mime.toLowerCase();
  if (m === "application/pdf") return "PDF";
  if (m.startsWith("image/")) return "Image";
  if (m.includes("wordprocessingml") || m === "application/msword") return "Word";
  if (m.includes("csv") || m === "text/csv") return "CSV";
  if (m.startsWith("text/")) return "Text";
  return mime.split("/")[1]?.toUpperCase() ?? "File";
}

function statusBadgeClass(s: SellerSupportingDocumentStatus): string {
  if (s === "VERIFIED") return "bg-emerald-500/20 text-emerald-300";
  if (s === "REJECTED") return "bg-red-500/20 text-red-300";
  return "bg-amber-500/20 text-amber-200";
}

const STATUS_LABEL: Record<SellerSupportingDocumentStatus, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

const fileBase = (listingId: string, docId: string) => `/api/fsbo/listings/${listingId}/seller-documents/${docId}/file`;

export function SellerDocumentsPanel({
  fsboListingId,
  canEdit,
}: {
  fsboListingId: string;
  canEdit: boolean;
}) {
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [category, setCategory] = useState<SellerSupportingDocumentCategory>("OTHER");
  const [declarationSectionKey, setDeclarationSectionKey] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setListError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/fsbo/listings/${fsboListingId}/seller-documents`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(typeof data.error === "string" ? data.error : "Could not load documents");
        setDocuments([]);
        return;
      }
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch {
      setListError("Could not load documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [fsboListingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setUploadError(null);
    setSuccessMessage(null);
    setUploading(true);
    setProgress(0);

    let done = 0;
    let batchError: string | null = null;
    for (const file of arr) {
      const form = new FormData();
      form.set("file", file);
      form.set("category", category);
      if (declarationSectionKey) {
        form.set("declarationSectionKey", declarationSectionKey);
      }
      try {
        const res = await fetch(`/api/fsbo/listings/${fsboListingId}/seller-documents`, {
          method: "POST",
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Upload failed");
        }
      } catch (e) {
        batchError = e instanceof Error ? e.message : "Upload failed";
        setUploadError(batchError);
        break;
      }
      done += 1;
      setProgress(Math.round((done / arr.length) * 100));
    }

    setUploading(false);
    if (!batchError && done === arr.length) {
      setSuccessMessage(arr.length === 1 ? "File uploaded." : `${arr.length} files uploaded.`);
      void load();
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (!canEdit || uploading) return;
    if (e.dataTransfer.files?.length) {
      void uploadFiles(e.dataTransfer.files);
    }
  };

  const onDelete = async (docId: string) => {
    if (!confirm("Delete this document? You can upload a replacement afterward.")) return;
    setUploadError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/fsbo/listings/${fsboListingId}/seller-documents/${docId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(typeof data.error === "string" ? data.error : "Delete failed");
        return;
      }
      setSuccessMessage("Document removed.");
      void load();
    } catch {
      setUploadError("Delete failed");
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
      <h2 className="text-lg font-semibold text-white">Documents &amp; Proof (Seller)</h2>
      <p className="mt-1 text-sm text-slate-400">
        Upload all supporting documents required for transparency and verification
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">Category</span>
          <select
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2.5 text-sm text-white"
            value={category}
            onChange={(e) => setCategory(e.target.value as SellerSupportingDocumentCategory)}
            disabled={!canEdit || uploading}
          >
            {SELLER_DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SELLER_DOCUMENT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Link to declaration section (optional)</span>
          <select
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2.5 text-sm text-white"
            value={declarationSectionKey}
            onChange={(e) => setDeclarationSectionKey(e.target.value)}
            disabled={!canEdit || uploading}
          >
            {DECLARATION_SECTION_LINK_OPTIONS.map((o) => (
              <option key={o.value || "none"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {canEdit ? (
        <div
          role="presentation"
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={onDrop}
          className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 transition-colors ${
            dragOver ? "border-premium-gold bg-premium-gold/10" : "border-white/20 bg-[#0B0B0B]/50"
          } ${uploading ? "pointer-events-none opacity-70" : ""}`}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.csv,text/csv,application/pdf,image/*"
            onChange={(e) => {
              const f = e.target.files;
              if (f?.length) void uploadFiles(f);
              e.target.value = "";
            }}
            disabled={uploading}
          />
          <p className="text-center text-sm font-medium text-white">Drag &amp; drop files here</p>
          <p className="mt-2 text-center text-xs text-slate-500">or click to browse · PDF, images, Word, CSV · max 10MB each</p>
          {uploading ? (
            <div className="mt-4 w-full max-w-sm">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-premium-gold transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">Uploading… {progress}%</p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
          This listing cannot be edited right now. You can still view or download documents below.
        </p>
      )}

      {uploadError ? <p className="mt-4 text-sm text-red-400">{uploadError}</p> : null}
      {successMessage ? <p className="mt-4 text-sm text-emerald-400">{successMessage}</p> : null}
      {listError ? <p className="mt-4 text-sm text-red-400">{listError}</p> : null}

      <div className="mt-8">
        <h3 className="text-sm font-medium text-slate-300">Uploaded files</h3>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : documents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No documents yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {documents.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0B0B0B] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{d.originalFileName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {fileTypeLabel(d.mimeType)} · {SELLER_DOCUMENT_CATEGORY_LABELS[d.category]}
                    {d.declarationSectionKey ? (
                      <>
                        {" "}
                        · Declaration:{" "}
                        {DECLARATION_SECTION_LINK_OPTIONS.find((x) => x.value === d.declarationSectionKey)?.label ??
                          d.declarationSectionKey}
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {new Date(d.createdAt).toLocaleString()} ·{" "}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${statusBadgeClass(d.status)}`}>
                      {STATUS_LABEL[d.status]}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={fileBase(fsboListingId, d.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5"
                  >
                    View
                  </a>
                  <a
                    href={`${fileBase(fsboListingId, d.id)}?download=1`}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5"
                  >
                    Download
                  </a>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => void onDelete(d.id)}
                      className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
