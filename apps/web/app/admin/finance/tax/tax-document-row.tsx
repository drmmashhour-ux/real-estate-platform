"use client";

import { useState } from "react";

export function TaxDocumentRow({
  id,
  title,
  documentType,
  createdAt,
  subjectEmail,
}: {
  id: string;
  title: string;
  documentType: string;
  createdAt: string;
  subjectEmail?: string | null;
}) {
  const [msg, setMsg] = useState<string | null>(null);

  async function remove() {
    if (!confirm("Delete this generated document record? You can regenerate later.")) return;
    setMsg(null);
    const res = await fetch(`/api/admin/finance/tax/${id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(j.error ?? "Failed");
    else window.location.reload();
  }

  return (
    <li className="card-premium flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <p className="font-medium text-slate-100">{title}</p>
        <p className="text-xs text-slate-500">
          {documentType} · {createdAt.slice(0, 10)}
          {subjectEmail ? ` · ${subjectEmail}` : ""}
        </p>
        {msg && <p className="text-xs text-rose-400">{msg}</p>}
      </div>
      <div className="flex gap-2">
        <a href={`/api/admin/finance/tax/${id}/pdf`} className="btn-secondary text-xs">
          Download PDF
        </a>
        <button type="button" className="btn-secondary border border-rose-900/50 text-xs text-rose-300" onClick={() => void remove()}>
          Delete
        </button>
      </div>
    </li>
  );
}
