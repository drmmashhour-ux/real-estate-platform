"use client";

import { useCallback, useState } from "react";
import type { RequiredDocumentCategory, RequiredDocumentStatus } from "@prisma/client";

const CATEGORY_ORDER: RequiredDocumentCategory[] = [
  "IDENTITY",
  "INCOME",
  "BANKING",
  "TAX",
  "RESIDENCY",
  "CREDIT",
  "EMPLOYMENT",
  "CORPORATE",
  "PROPERTY",
  "OTHER",
];

function statusBadgeClass(s: RequiredDocumentStatus): string {
  switch (s) {
    case "APPROVED":
      return "bg-emerald-500/20 text-emerald-200";
    case "REJECTED":
      return "bg-rose-500/20 text-rose-200";
    case "WAIVED":
      return "bg-slate-500/20 text-slate-300";
    case "UNDER_REVIEW":
      return "bg-amber-500/20 text-amber-200";
    case "UPLOADED":
      return "bg-sky-500/20 text-sky-200";
    case "REQUESTED":
      return "bg-violet-500/20 text-violet-200";
    default:
      return "bg-white/10 text-slate-300";
  }
}

export type ChecklistItem = {
  id: string;
  title: string;
  description: string | null;
  category: RequiredDocumentCategory;
  status: RequiredDocumentStatus;
  isMandatory: boolean;
  dueAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  linkedDocumentFile: {
    id: string;
    originalName: string;
    status: string;
  } | null;
};

type Role = "broker" | "client";

type Props = {
  brokerClientId: string;
  items: ChecklistItem[];
  role: Role;
  onChanged?: () => void;
};

export function RequiredDocumentsChecklist({ brokerClientId, items, role, onChanged }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(() => {
    onChanged?.();
  }, [onChanged]);

  async function uploadForItem(itemId: string, file: File) {
    setErr(null);
    setBusyId(itemId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("contextType", "client");
      fd.append("contextId", brokerClientId);
      fd.append("category", "OTHER");
      fd.append("visibility", "CLIENT_VISIBLE");

      const up = await fetch("/api/documents/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const j = (await up.json()) as { error?: string; file?: { id: string } };
      if (!up.ok || !j.file?.id) {
        setErr(j.error ?? "Upload failed");
        return;
      }

      const link = await fetch(`/api/intake/required-documents/${encodeURIComponent(itemId)}/upload-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ documentFileId: j.file.id }),
      });
      const lj = (await link.json()) as { error?: string };
      if (!link.ok) {
        setErr(lj.error ?? "Could not attach file");
        return;
      }
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function requestDoc(itemId: string) {
    setErr(null);
    setBusyId(itemId);
    try {
      const res = await fetch(`/api/intake/required-documents/${encodeURIComponent(itemId)}/request`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) setErr(j.error ?? "Request failed");
      else refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function review(itemId: string, decision: "approve" | "reject") {
    setErr(null);
    setBusyId(itemId);
    try {
      const res = await fetch(`/api/intake/required-documents/${encodeURIComponent(itemId)}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          decision,
          rejectionReason: decision === "reject" ? undefined : undefined,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) setErr(j.error ?? "Review failed");
      else refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function waive(itemId: string) {
    setErr(null);
    setBusyId(itemId);
    try {
      const res = await fetch(`/api/intake/required-documents/${encodeURIComponent(itemId)}/waive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({}),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) setErr(j.error ?? "Waive failed");
      else refresh();
    } finally {
      setBusyId(null);
    }
  }

  const grouped = new Map<RequiredDocumentCategory, ChecklistItem[]>();
  for (const c of CATEGORY_ORDER) grouped.set(c, []);
  for (const it of items) {
    const g = grouped.get(it.category) ?? [];
    g.push(it);
    grouped.set(it.category, g);
  }

  return (
    <div className="space-y-6">
      {err ? <p className="text-sm text-rose-400">{err}</p> : null}
      {CATEGORY_ORDER.map((cat) => {
        const list = grouped.get(cat) ?? [];
        if (list.length === 0) return null;
        return (
          <div key={cat}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{cat.replace(/_/g, " ")}</h4>
            <ul className="mt-2 space-y-3">
              {list.map((it) => (
                <li
                  key={it.id}
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-white">{it.title}</span>
                        {it.isMandatory ? (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-200">
                            Required
                          </span>
                        ) : (
                          <span className="rounded bg-slate-500/20 px-1.5 py-0.5 text-[10px] text-slate-400">
                            Optional
                          </span>
                        )}
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${statusBadgeClass(it.status)}`}>
                          {it.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      {it.description ? (
                        <p className="mt-1 text-sm text-slate-400">{it.description}</p>
                      ) : null}
                      {it.dueAt ? (
                        <p className="mt-1 text-xs text-slate-500">Due {new Date(it.dueAt).toLocaleDateString()}</p>
                      ) : null}
                      {it.status === "REJECTED" && it.rejectionReason ? (
                        <p className="mt-2 rounded border border-rose-500/30 bg-rose-950/40 px-2 py-1 text-sm text-rose-200">
                          {it.rejectionReason}
                        </p>
                      ) : null}
                      {it.notes && role === "broker" ? (
                        <p className="mt-2 text-xs text-slate-500">Broker notes: {it.notes}</p>
                      ) : null}
                      {it.linkedDocumentFile ? (
                        <p className="mt-2 text-xs text-slate-400">
                          Linked:{" "}
                          <a
                            href={`/api/documents/files/${encodeURIComponent(it.linkedDocumentFile.id)}/download`}
                            className="text-emerald-400 hover:underline"
                          >
                            {it.linkedDocumentFile.originalName}
                          </a>
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {role === "client" &&
                      (it.status === "REQUESTED" ||
                        it.status === "REJECTED" ||
                        it.status === "REQUIRED") ? (
                        <label className="cursor-pointer rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-900/40">
                          {busyId === it.id ? "…" : "Upload"}
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            disabled={busyId === it.id}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (f) void uploadForItem(it.id, f);
                            }}
                          />
                        </label>
                      ) : null}
                      {role === "broker" ? (
                        <div className="flex flex-wrap justify-end gap-1">
                          {it.status === "REQUIRED" || it.status === "REQUESTED" ? (
                            <button
                              type="button"
                              disabled={busyId === it.id}
                              onClick={() => void requestDoc(it.id)}
                              className="rounded border border-white/15 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                            >
                              Request
                            </button>
                          ) : null}
                          {it.linkedDocumentFile &&
                          (it.status === "UPLOADED" || it.status === "UNDER_REVIEW") ? (
                            <>
                              <button
                                type="button"
                                disabled={busyId === it.id}
                                onClick={() => void review(it.id, "approve")}
                                className="rounded border border-emerald-500/40 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-950/40"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={busyId === it.id}
                                onClick={() => void review(it.id, "reject")}
                                className="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-200 hover:bg-rose-950/40"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                          {it.status !== "WAIVED" && it.status !== "APPROVED" ? (
                            <button
                              type="button"
                              disabled={busyId === it.id}
                              onClick={() => void waive(it.id)}
                              className="rounded border border-slate-500/40 px-2 py-1 text-xs text-slate-300 hover:bg-white/5"
                            >
                              Waive
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
