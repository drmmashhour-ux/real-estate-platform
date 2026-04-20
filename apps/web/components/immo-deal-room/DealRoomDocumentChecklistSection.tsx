"use client";

import { useMemo, useState } from "react";

import type { DealRoomDocument } from "@/modules/deal-room/deal-room.types";
import type { DealRoomEntityType } from "@/modules/deal-room/deal-room.types";
import {
  templateAllowedForRoom,
  type DocumentChecklistTemplateId,
} from "@/modules/deal-room/deal-room-document-templates";
import type {
  DealRoomDocumentPacketSummary,
  DealRoomDocumentRequirement,
  DealRoomDocumentWorkflowStatus,
} from "@/modules/deal-room/deal-room-document-workflow.types";

const EMPTY_PACKET: DealRoomDocumentPacketSummary = {
  totalRequired: 0,
  receivedCount: 0,
  approvedCount: 0,
  missingCount: 0,
  completionRate: 0,
};

const STATUS_FLOW: DealRoomDocumentWorkflowStatus[] = [
  "missing",
  "requested",
  "received",
  "under_review",
  "approved",
  "rejected",
  "expired",
];

function docTitleForAttachment(id: string | undefined, documents: DealRoomDocument[]): string | null {
  if (!id) return null;
  const d = documents.find((x) => x.id === id);
  return d?.title ?? id.slice(0, 10);
}

export function DealRoomDocumentChecklistSection({
  roomId,
  entityType,
  documentRequirements,
  packetSummary,
  missingRequiredDocuments,
  documents,
  canEdit,
  canReviewDocs,
  busy,
  run,
}: {
  roomId: string;
  entityType: DealRoomEntityType;
  documentRequirements: DealRoomDocumentRequirement[];
  packetSummary: DealRoomDocumentPacketSummary | undefined;
  missingRequiredDocuments: DealRoomDocumentRequirement[] | undefined;
  documents: DealRoomDocument[];
  canEdit: boolean;
  canReviewDocs: boolean;
  busy: boolean;
  run: (req: () => Promise<Response>) => Promise<boolean>;
}) {
  const summary = packetSummary ?? EMPTY_PACKET;
  const missing = missingRequiredDocuments ?? [];
  const reqs = documentRequirements ?? [];

  const templates = useMemo(() => {
    const ids: DocumentChecklistTemplateId[] = ["buyer_lead", "broker_listing", "property_review"];
    return ids.filter((id) => templateAllowedForRoom(entityType, id));
  }, [entityType]);

  const [templateChoice, setTemplateChoice] = useState<DocumentChecklistTemplateId | "">(
    templates[0] ?? ""
  );

  const [newRow, setNewRow] = useState({
    title: "",
    category: "support" as DealRoomDocumentRequirement["category"],
    required: true,
  });

  const [attachDraft, setAttachDraft] = useState<Record<string, { url: string; title: string }>>({});

  const pct = Math.round(summary.completionRate * 100);

  const incomplete = summary.totalRequired > 0 && summary.approvedCount < summary.totalRequired;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <h2 className="text-lg font-medium text-white">Document checklist</h2>
      <p className="mt-1 text-xs text-slate-500">
        Operational checklist — not e-sign. Approve/reject in V1 is for admins and internal operators only.
      </p>

      <div className="mt-4 grid gap-3 rounded-lg border border-slate-700/80 bg-black/25 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="text-[11px] uppercase text-slate-500">Required total</p>
          <p className="text-xl font-semibold text-white">{summary.totalRequired}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-slate-500">Missing (not approved)</p>
          <p className="text-xl font-semibold text-amber-200">{summary.missingCount}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-slate-500">Received</p>
          <p className="text-xl font-semibold text-sky-200">{summary.receivedCount}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-slate-500">Approved</p>
          <p className="text-xl font-semibold text-emerald-200">{summary.approvedCount}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-slate-500">Packet complete</p>
          <p className="text-xl font-semibold text-white">{pct}%</p>
        </div>
      </div>

      {incomplete ? (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">Packet incomplete</p>
          <p className="mt-1 text-xs text-amber-200/80">
            Required items must reach <strong>approved</strong> for a clean packet (internal review).
          </p>
        </div>
      ) : summary.totalRequired > 0 ? (
        <div className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-4 py-2 text-sm text-emerald-100">
          All required items approved — review-ready packet.
        </div>
      ) : null}

      {missing.length > 0 ? (
        <div className="mt-4 rounded-lg border border-rose-900/40 bg-rose-950/30 px-4 py-3">
          <p className="text-sm font-medium text-rose-100">Missing required items</p>
          <ul className="mt-2 list-inside list-disc text-sm text-rose-100/90">
            {missing.map((m) => (
              <li key={m.id}>
                {m.title} — <span className="text-rose-200/70">{m.status}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canEdit && templates.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-800 p-3">
          <div className="min-w-[200px] flex-1">
            <label className="text-[11px] text-slate-500">Apply template</label>
            <select
              className="mt-1 w-full rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
              value={templateChoice}
              onChange={(e) => setTemplateChoice(e.target.value as DocumentChecklistTemplateId)}
            >
              {templates.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={busy || !templateChoice}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-50"
            onClick={() =>
              void run(() =>
                fetch(`/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/document-requirements/apply-template`, {
                  method: "POST",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ templateId: templateChoice }),
                })
              )
            }
          >
            Apply checklist template
          </button>
        </div>
      ) : null}

      {canEdit ? (
        <div className="mt-4 grid gap-2 rounded-lg border border-slate-800 p-3 sm:grid-cols-3">
          <input
            className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white sm:col-span-3"
            placeholder="New requirement title"
            value={newRow.title}
            onChange={(e) => setNewRow((r) => ({ ...r, title: e.target.value }))}
          />
          <select
            className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
            value={newRow.category}
            onChange={(e) =>
              setNewRow((r) => ({ ...r, category: e.target.value as DealRoomDocumentRequirement["category"] }))
            }
          >
            {(["identity", "property", "offer", "broker", "financial", "support", "other"] as const).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={newRow.required}
              onChange={(e) => setNewRow((r) => ({ ...r, required: e.target.checked }))}
            />
            Required for packet
          </label>
          <button
            type="button"
            disabled={busy || !newRow.title.trim()}
            className="rounded-lg bg-amber-700/90 px-3 py-2 text-sm text-white hover:bg-amber-600 disabled:opacity-50"
            onClick={() =>
              void run(() =>
                fetch(`/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/document-requirements`, {
                  method: "POST",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: newRow.title.trim(),
                    category: newRow.category,
                    required: newRow.required,
                  }),
                })
              ).then((ok) => {
                if (ok) setNewRow((r) => ({ ...r, title: "" }));
              })
            }
          >
            Add requirement
          </button>
        </div>
      ) : null}

      <ul className="mt-6 space-y-4">
        {reqs.map((req) => (
          <li key={req.id} className="rounded-lg border border-slate-800/90 bg-black/20 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-white">{req.title}</p>
                <p className="text-xs text-slate-500">
                  {req.category} · {req.required ? "required" : "optional"} ·{" "}
                  <span className="text-slate-300">{req.status}</span>
                </p>
                {req.notes ? <p className="mt-1 text-xs text-slate-400">{req.notes}</p> : null}
                {req.attachedDocumentId ? (
                  <p className="mt-1 text-xs text-emerald-400">
                    Attached: {docTitleForAttachment(req.attachedDocumentId, documents) ?? req.attachedDocumentId}
                  </p>
                ) : null}
              </div>
            </div>

            {canEdit ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || req.status === "requested"}
                  className="rounded border border-slate-600 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                  onClick={() =>
                    void run(() =>
                      fetch(
                        `/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/document-requirements/${encodeURIComponent(req.id)}`,
                        {
                          method: "PATCH",
                          credentials: "same-origin",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "requested" }),
                        }
                      )
                    )
                  }
                >
                  Mark requested
                </button>
                <button
                  type="button"
                  disabled={busy || req.status === "under_review"}
                  className="rounded border border-slate-600 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                  onClick={() =>
                    void run(() =>
                      fetch(
                        `/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/document-requirements/${encodeURIComponent(req.id)}`,
                        {
                          method: "PATCH",
                          credentials: "same-origin",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "under_review" }),
                        }
                      )
                    )
                  }
                >
                  Under review
                </button>
                {canReviewDocs ? (
                  <>
                    <button
                      type="button"
                      disabled={busy || req.status === "approved"}
                      className="rounded border border-emerald-700 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-950/50 disabled:opacity-40"
                      onClick={() =>
                        void run(() =>
                          fetch(
                            `/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/document-requirements/${encodeURIComponent(req.id)}`,
                            {
                              method: "PATCH",
                              credentials: "same-origin",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "approved" }),
                            }
                          )
                        )
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy || req.status === "rejected"}
                      className="rounded border border-rose-800 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-950/40 disabled:opacity-40"
                      onClick={() =>
                        void run(() =>
                          fetch(
                            `/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/document-requirements/${encodeURIComponent(req.id)}`,
                            {
                              method: "PATCH",
                              credentials: "same-origin",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "rejected" }),
                            }
                          )
                        )
                      }
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                <div className="flex w-full flex-wrap gap-2 border-t border-slate-800 pt-3 mt-1">
                  <input
                    className="min-w-[160px] flex-1 rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                    placeholder="Link URL"
                    value={attachDraft[req.id]?.url ?? ""}
                    onChange={(e) =>
                      setAttachDraft((d) => ({
                        ...d,
                        [req.id]: { url: e.target.value, title: d[req.id]?.title ?? "" },
                      }))
                    }
                  />
                  <input
                    className="min-w-[120px] flex-1 rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                    placeholder="Doc title (optional)"
                    value={attachDraft[req.id]?.title ?? ""}
                    onChange={(e) =>
                      setAttachDraft((d) => ({
                        ...d,
                        [req.id]: { url: d[req.id]?.url ?? "", title: e.target.value },
                      }))
                    }
                  />
                  <button
                    type="button"
                    disabled={busy || !(attachDraft[req.id]?.url ?? "").trim()}
                    className="rounded bg-slate-700 px-2 py-1 text-[11px] text-white hover:bg-slate-600 disabled:opacity-50"
                    onClick={() => {
                      void run(() =>
                        fetch(
                          `/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/document-requirements/${encodeURIComponent(req.id)}/attach`,
                          {
                            method: "POST",
                            credentials: "same-origin",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              title: attachDraft[req.id]?.title?.trim() || undefined,
                              kind: "external_link",
                              url: attachDraft[req.id]?.url?.trim(),
                            }),
                          }
                        )
                      ).then((ok) => {
                        if (ok) {
                          setAttachDraft((d) => {
                            const next = { ...d };
                            delete next[req.id];
                            return next;
                          });
                        }
                      });
                    }}
                  >
                    Attach link
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW.filter((s) => s !== req.status)
                    .filter((s) => canReviewDocs || (s !== "approved" && s !== "rejected"))
                    .map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={
                        busy ||
                        (["approved", "rejected"].includes(s) && !canReviewDocs)
                      }
                      className="rounded border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-500 hover:bg-slate-800 disabled:opacity-30"
                      onClick={() =>
                        void run(() =>
                          fetch(
                            `/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/document-requirements/${encodeURIComponent(req.id)}`,
                            {
                              method: "PATCH",
                              credentials: "same-origin",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: s }),
                            }
                          )
                        )
                      }
                    >
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {reqs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No checklist rows yet — apply a template or add requirements.</p>
      ) : null}
    </section>
  );
}
