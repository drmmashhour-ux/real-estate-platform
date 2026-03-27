"use client";

import { useEffect, useState } from "react";

export type PreviewFile = {
  id: string;
  fileName: string;
  mimeType: string;
  category: string;
  visibility: string;
  tags: string[];
  description: string | null;
  uploadedBy: { name: string | null; email: string } | null;
  listingId: string | null;
  brokerClientId: string | null;
  offerId: string | null;
  contractId: string | null;
  appointmentId: string | null;
  conversationId: string | null;
};

export function DocumentFilePreview({
  file,
  onClose,
}: {
  file: PreviewFile | null;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    let revoked: string | null = null;
    setErr(null);
    void (async () => {
      try {
        const res = await fetch(`/api/documents/files/${encodeURIComponent(file.id)}/download`, {
          credentials: "same-origin",
        });
        if (!res.ok) {
          setErr("Could not load preview");
          return;
        }
        const blob = await res.blob();
        const u = URL.createObjectURL(blob);
        revoked = u;
        setUrl(u);
      } catch {
        setErr("Could not load preview");
      }
    })();
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [file]);

  if (!file) return null;

  const isPdf = file.mimeType === "application/pdf";
  const isImage = file.mimeType.startsWith("image/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="truncate text-lg font-medium text-white">{file.fileName}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="min-h-[200px] flex-1 overflow-auto bg-slate-900/80 p-4">
          {err && <p className="text-sm text-red-400">{err}</p>}
          {!err && url && isPdf && (
            <iframe title="PDF preview" src={url} className="h-[70vh] w-full rounded border border-slate-800" />
          )}
          {!err && url && isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="mx-auto max-h-[70vh] max-w-full object-contain" />
          )}
          {!err && url && !isPdf && !isImage && (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-slate-300">
              <p className="text-sm">Preview is not available for this file type.</p>
              <p className="mt-2 text-xs text-slate-500">{file.mimeType}</p>
            </div>
          )}
        </div>
        <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          <p>
            <span className="text-slate-500">Uploader:</span>{" "}
            {file.uploadedBy?.name || file.uploadedBy?.email || "—"}
          </p>
          <p className="mt-1">
            <span className="text-slate-500">Category:</span> {file.category} ·{" "}
            <span className="text-slate-500">Visibility:</span> {file.visibility}
          </p>
          {file.tags?.length ? (
            <p className="mt-1">
              <span className="text-slate-500">Tags:</span> {file.tags.join(", ")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
