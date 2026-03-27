"use client";

import { useCallback, useState } from "react";
import { DOCUMENT_ALLOWED_EXTENSIONS, DOCUMENT_MAX_BYTES } from "@/modules/documents/services/constants";

type Props = {
  folderId: string;
  disabled?: boolean;
  onUploaded?: () => void;
};

export function DocumentUploadDropzone({ folderId, disabled, onUploaded }: Props) {
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setMessage(null);
      if (file.size > DOCUMENT_MAX_BYTES) {
        setMessage("File is too large (max 25 MB).");
        setProgress("error");
        return;
      }
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (!DOCUMENT_ALLOWED_EXTENSIONS.has(ext)) {
        setMessage("This file type is not allowed.");
        setProgress("error");
        return;
      }
      setProgress("uploading");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folderId", folderId);
      fd.append("category", "OTHER");
      fd.append("visibility", "PRIVATE_INTERNAL");
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage(j.error ?? "Upload failed");
        setProgress("error");
        return;
      }
      setProgress("done");
      onUploaded?.();
      setTimeout(() => setProgress("idle"), 1200);
    },
    [folderId, onUploaded]
  );

  return (
    <div
      className={`rounded-xl border border-dashed px-4 py-8 text-center transition-colors ${
        drag ? "border-amber-400/60 bg-amber-500/5" : "border-slate-600 bg-slate-900/40"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) void upload(f);
      }}
    >
      <p className="text-sm text-slate-300">Drag and drop a file here, or</p>
      <label className="mt-2 inline-block cursor-pointer text-sm font-medium text-amber-400 hover:text-amber-300">
        choose file
        <input
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </label>
      <p className="mt-2 text-xs text-slate-500">PDF, PNG, JPEG, DOC/DOCX · max 25 MB</p>
      {progress === "uploading" && <p className="mt-3 text-sm text-slate-400">Uploading…</p>}
      {progress === "done" && <p className="mt-3 text-sm text-emerald-400">Uploaded.</p>}
      {message && <p className="mt-3 text-sm text-red-400">{message}</p>}
    </div>
  );
}
