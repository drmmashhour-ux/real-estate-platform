"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SellerDeclarationData } from "@/lib/fsbo/seller-declaration-schema";

type Props = {
  listingId: string | null;
  value: SellerDeclarationData;
  patch: (partial: Partial<SellerDeclarationData>) => void;
};

export function SellerTaxesAssistantPanel({ listingId, value, patch }: Props) {
  const [docs, setDocs] = useState<{ id: string; originalFileName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    if (!listingId) {
      setDocs([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/fsbo/listings/${listingId}/seller-documents`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDocs([]);
        return;
      }
      const list = Array.isArray(data.documents) ? data.documents : [];
      const forTaxes = list.filter(
        (x: { id?: string; declarationSectionKey?: string | null; originalFileName?: string }) =>
          x.declarationSectionKey === "taxes"
      );
      setDocs(
        forTaxes.map((x: { id?: string; originalFileName?: string }) => ({
          id: String(x.id),
          originalFileName: String(x.originalFileName ?? "document"),
        }))
      );
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !listingId) return;
    setUploading(true);
    setUploadErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("category", "OTHER");
      fd.set("declarationSectionKey", "taxes");
      const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(listingId)}/seller-documents`, {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { document?: { id?: string }; error?: string };
      if (!res.ok) {
        setUploadErr(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      const newId = data.document?.id;
      if (typeof newId === "string") {
        const cur = value.taxSupportingDocumentIds ?? [];
        if (!cur.includes(newId)) {
          patch({ taxSupportingDocumentIds: [...cur, newId] });
        }
      }
      await loadDocs();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sky-500/25 bg-sky-950/25 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-200/90">AI assistant — taxes</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Your <strong className="text-white">municipal tax bill</strong> usually splits{" "}
          <strong className="text-white">municipal / city</strong> and <strong className="text-white">school</strong>{" "}
          amounts. Enter the annual portions you see on the bill (or your best estimate). Upload a PDF or photo of the
          bill so compliance can verify figures later.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-400">
          <li>Round numbers are fine — mark them as estimates in the fields below.</li>
          <li>Welcome tax is a buyer transfer tax; it stays illustrative on this page.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/tools/municipality-school-tax"
            className="inline-flex rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/20"
          >
            Municipality &amp; school tax tool →
          </Link>
          <Link
            href="/tools/welcome-tax"
            className="inline-flex rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-premium-gold/40 hover:text-premium-gold"
          >
            Welcome tax estimator →
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-slate-300">
          City / municipal tax (annual est.)
          <input
            value={value.cityTaxEstimateYearly ?? ""}
            onChange={(e) => patch({ cityTaxEstimateYearly: e.target.value })}
            placeholder="e.g. $1,850 / year from tax bill"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder:text-slate-600"
          />
        </label>
        <label className="block text-sm text-slate-300">
          School tax (annual est.)
          <input
            value={value.schoolTaxEstimateYearly ?? ""}
            onChange={(e) => patch({ schoolTaxEstimateYearly: e.target.value })}
            placeholder="e.g. $420 / year from tax bill"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder:text-slate-600"
          />
        </label>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/30 p-3">
        <p className="text-xs font-medium text-slate-400">Tax bill &amp; supporting documents</p>
        {!listingId ? (
          <p className="mt-2 text-xs text-amber-300/90">Save your listing draft first to upload documents.</p>
        ) : (
          <>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              onChange={(e) => void onUpload(e)}
              className="mt-2 block text-xs text-slate-400"
            />
            {uploading ? <p className="mt-1 text-xs text-slate-500">Uploading…</p> : null}
            {uploadErr ? <p className="mt-1 text-xs text-red-400">{uploadErr}</p> : null}
            {loading ? (
              <p className="mt-2 text-xs text-slate-500">Loading uploads…</p>
            ) : docs.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {docs.map((d) => (
                  <li key={d.id} className="text-premium-gold">
                    {d.originalFileName}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Optional — add your latest municipal tax notice or bill.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
