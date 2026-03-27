"use client";

import { useState } from "react";
import { ShareDocumentDialog } from "@/components/documents/ShareDocumentDialog";
import type { PreviewFile } from "@/components/documents/DocumentFilePreview";

export type FileRow = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  visibility: string;
  updatedAt: string;
  uploadedBy: { name: string | null; email: string } | null;
  description: string | null;
  tags: string[];
  listingId: string | null;
  brokerClientId: string | null;
  offerId: string | null;
  contractId: string | null;
  appointmentId: string | null;
  conversationId: string | null;
};

export function DocumentFileList({
  files,
  canManage,
  onRefresh,
  onPreview,
}: {
  files: FileRow[];
  canManage: boolean;
  onRefresh: () => Promise<void> | void;
  onPreview: (f: PreviewFile) => void;
}) {
  const [shareId, setShareId] = useState<string | null>(null);

  async function act(id: string, action: "archive" | "delete" | "download") {
    if (action === "download") {
      window.location.href = `/api/documents/files/${encodeURIComponent(id)}/download`;
      return;
    }
    const path =
      action === "archive"
        ? `/api/documents/files/${encodeURIComponent(id)}/archive`
        : `/api/documents/files/${encodeURIComponent(id)}`;
    const res = await fetch(path, {
      method: action === "archive" ? "POST" : "DELETE",
      credentials: "same-origin",
    });
    if (res.ok) await onRefresh();
  }

  async function rename(id: string, current: string) {
    const next = window.prompt("New file name", current);
    if (!next?.trim() || next === current) return;
    const res = await fetch(`/api/documents/files/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ fileName: next.trim() }),
    });
    if (res.ok) await onRefresh();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-slate-500">
            <th className="pb-2 pr-3 font-medium">Name</th>
            <th className="pb-2 pr-3 font-medium">Type</th>
            <th className="pb-2 pr-3 font-medium">Category</th>
            <th className="pb-2 pr-3 font-medium">Size</th>
            <th className="pb-2 pr-3 font-medium">By</th>
            <th className="pb-2 pr-3 font-medium">Updated</th>
            <th className="pb-2 pr-3 font-medium">Visibility</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id} className="border-b border-slate-800/80 text-slate-200">
              <td className="py-2 pr-3 font-medium text-white">{f.fileName}</td>
              <td className="py-2 pr-3 text-slate-400">{f.mimeType}</td>
              <td className="py-2 pr-3 text-slate-400">{f.category}</td>
              <td className="py-2 pr-3 text-slate-400">{(f.sizeBytes / 1024).toFixed(1)} KB</td>
              <td className="py-2 pr-3 text-slate-400">{f.uploadedBy?.name || f.uploadedBy?.email || "—"}</td>
              <td className="py-2 pr-3 text-slate-500">{new Date(f.updatedAt).toLocaleString()}</td>
              <td className="py-2 pr-3">
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{f.visibility}</span>
              </td>
              <td className="py-2">
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="rounded px-2 py-0.5 text-xs text-amber-400 hover:bg-slate-800"
                    onClick={() => onPreview(f)}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800"
                    onClick={() => void act(f.id, "download")}
                  >
                    Download
                  </button>
                  {canManage ? (
                    <>
                      <button
                        type="button"
                        className="rounded px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800"
                        onClick={() => void rename(f.id, f.fileName)}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="rounded px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800"
                        onClick={() => void act(f.id, "archive")}
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-slate-800"
                        onClick={() => {
                          if (window.confirm("Delete this file?")) void act(f.id, "delete");
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="rounded px-2 py-0.5 text-xs text-emerald-400 hover:bg-slate-800"
                        onClick={() => setShareId(f.id)}
                      >
                        Share
                      </button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {shareId ? (
        <ShareDocumentDialog fileId={shareId} onClose={() => setShareId(null)} onSaved={() => void onRefresh()} />
      ) : null}
    </div>
  );
}
