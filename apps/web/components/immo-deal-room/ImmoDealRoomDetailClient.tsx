"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { contextLinkForRoom } from "@/lib/immo-deal-room/room-abilities-shared";
import { DealRoomDocumentChecklistSection } from "@/components/immo-deal-room/DealRoomDocumentChecklistSection";
import type {
  DealRoom,
  DealRoomActivity,
  DealRoomDocument,
  DealRoomMeeting,
  DealRoomNote,
  DealRoomParticipant,
  DealRoomStatus,
  DealRoomTask,
} from "@/modules/deal-room/deal-room.types";
import type {
  DealRoomDocumentPacketSummary,
  DealRoomDocumentRequirement,
} from "@/modules/deal-room/deal-room-document-workflow.types";

export type ImmoDealRoomBundle = {
  room: DealRoom;
  participants: DealRoomParticipant[];
  notes: DealRoomNote[];
  tasks: DealRoomTask[];
  activities: DealRoomActivity[];
  meetings: DealRoomMeeting[];
  documents: DealRoomDocument[];
  documentRequirements?: DealRoomDocumentRequirement[];
  packetSummary?: DealRoomDocumentPacketSummary;
  missingRequiredDocuments?: DealRoomDocumentRequirement[];
};

const STATUSES: DealRoomStatus[] = [
  "open",
  "active",
  "pending_review",
  "paused",
  "closed",
  "archived",
];

export function ImmoDealRoomDetailClient({
  roomId,
  initial,
  abilities,
}: {
  roomId: string;
  initial: ImmoDealRoomBundle;
  abilities: { canManage: boolean; canEdit: boolean; canComment: boolean; canReviewDocs: boolean };
}) {
  const router = useRouter();
  const [bundle, setBundle] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ctx = useMemo(() => contextLinkForRoom(bundle.room), [bundle.room]);

  const reload = useCallback(async () => {
    const r = await fetch(`/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}`, { credentials: "same-origin" });
    const j = (await r.json().catch(() => null)) as ImmoDealRoomBundle | { error?: string } | null;
    if (!r.ok || !j || !("room" in j)) {
      setError(typeof (j as { error?: string })?.error === "string" ? (j as { error: string }).error : "Reload failed");
      return;
    }
    setBundle(j);
    router.refresh();
  }, [roomId, router]);

  const run = async (req: () => Promise<Response>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const res = await req();
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "Request failed");
      await reload();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const [noteDraft, setNoteDraft] = useState("");
  const [participantDraft, setParticipantDraft] = useState({
    displayName: "",
    email: "",
    role: "buyer" as DealRoomParticipant["role"],
    accessLevel: "comment" as DealRoomParticipant["accessLevel"],
  });
  const [taskDraft, setTaskDraft] = useState({ title: "", assignedTo: "", dueAt: "" });
  const [meetingDraft, setMeetingDraft] = useState({
    provider: "manual" as "zoom" | "teams" | "manual",
    title: "",
    manualUrl: "",
    scheduledAt: "",
  });
  const [docDraft, setDocDraft] = useState({
    title: "",
    kind: "placeholder" as DealRoomDocument["kind"],
    url: "",
  });

  return (
    <div className="space-y-8">
      <header className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">ImmoContact deal room</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">{bundle.room.title}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {bundle.room.entityType} · <span className="font-mono text-xs text-slate-500">{bundle.room.entityId}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={ctx.href} className="text-sm text-amber-400 hover:text-amber-300">
                {ctx.label} →
              </Link>
              <Link href="/dashboard/immo-deal-rooms" className="text-sm text-slate-500 hover:text-slate-300">
                All rooms
              </Link>
              <Link href="/dashboard/deal-rooms" className="text-sm text-slate-600 hover:text-slate-400">
                Pipeline deal rooms (CRM)
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-lg border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
              {bundle.room.status}
            </span>
            {abilities.canManage ? (
              <div className="flex flex-wrap justify-end gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy || bundle.room.status === s}
                    onClick={() =>
                      void run(() =>
                        fetch(`/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/status`, {
                          method: "PATCH",
                          credentials: "same-origin",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: s }),
                        })
                      )
                    }
                    className="rounded border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400 hover:bg-slate-800 disabled:opacity-40"
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <p className="mt-4 border-t border-slate-800 pt-4 text-xs text-slate-500">
          V1 internal collaboration — no automated messages, no payments or legal execution from this screen.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-900/50 bg-rose-950/40 px-4 py-2 text-sm text-rose-200">{error}</div>
      ) : null}

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-medium text-white">Participants</h2>
        <ul className="mt-3 space-y-2">
          {bundle.participants.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 px-3 py-2 text-sm"
            >
              <span className="text-white">
                {p.displayName}{" "}
                <span className="text-slate-500">
                  ({p.role}, {p.accessLevel})
                </span>
              </span>
              {abilities.canManage ? (
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs text-rose-400 hover:underline"
                  onClick={() =>
                    void run(() =>
                      fetch(`/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/participants`, {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ participantId: p.id }),
                      })
                    )
                  }
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {abilities.canManage ? (
          <div className="mt-4 grid gap-2 rounded-lg border border-slate-800 p-3 sm:grid-cols-2">
            <input
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
              placeholder="Display name"
              value={participantDraft.displayName}
              onChange={(e) => setParticipantDraft((d) => ({ ...d, displayName: e.target.value }))}
            />
            <input
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
              placeholder="Email (optional)"
              value={participantDraft.email}
              onChange={(e) => setParticipantDraft((d) => ({ ...d, email: e.target.value }))}
            />
            <select
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
              value={participantDraft.role}
              onChange={(e) =>
                setParticipantDraft((d) => ({ ...d, role: e.target.value as DealRoomParticipant["role"] }))
              }
            >
              {(["broker", "buyer", "seller", "reviewer", "guest", "host", "operator", "admin"] as const).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
              value={participantDraft.accessLevel}
              onChange={(e) =>
                setParticipantDraft((d) => ({
                  ...d,
                  accessLevel: e.target.value as DealRoomParticipant["accessLevel"],
                }))
              }
            >
              <option value="read">read</option>
              <option value="comment">comment</option>
              <option value="edit">edit</option>
              <option value="manage">manage</option>
            </select>
            <button
              type="button"
              disabled={busy || !participantDraft.displayName.trim()}
              className="rounded-lg bg-amber-600/80 px-3 py-2 text-sm font-medium text-black hover:bg-amber-500 disabled:opacity-50 sm:col-span-2"
              onClick={() =>
                void run(() =>
                  fetch(`/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/participants`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      displayName: participantDraft.displayName.trim(),
                      email: participantDraft.email.trim() || undefined,
                      role: participantDraft.role,
                      accessLevel: participantDraft.accessLevel,
                    }),
                  })
                ).then((ok) => {
                  if (ok) setParticipantDraft((d) => ({ ...d, displayName: "", email: "" }));
                })
              }
            >
              Add participant
            </button>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Participant changes require manage access.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-medium text-white">Notes</h2>
        <ul className="mt-3 space-y-3">
          {bundle.notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-slate-800/80 px-3 py-2 text-sm text-slate-200">
              <p className="whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {n.createdAt}
                {n.updatedAt !== n.createdAt ? ` · edited ${n.updatedAt}` : ""}
              </p>
            </li>
          ))}
        </ul>
        {abilities.canComment ? (
          <div className="mt-4 space-y-2">
            <textarea
              className="min-h-[88px] w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
              placeholder="Add an internal note…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <button
              type="button"
              disabled={busy || !noteDraft.trim()}
              className="rounded-lg bg-emerald-700/90 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
              onClick={() =>
                void run(() =>
                  fetch(`/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/notes`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ body: noteDraft }),
                  })
                ).then(() => setNoteDraft(""))
              }
            >
              Add note
            </button>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-medium text-white">Tasks</h2>
        <ul className="mt-3 space-y-2">
          {bundle.tasks.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-white">{t.title}</p>
                <p className="text-xs text-slate-500">
                  {t.status}
                  {t.assignedTo ? ` · assigned ${t.assignedTo}` : ""}
                  {t.dueAt ? ` · due ${t.dueAt}` : ""}
                </p>
              </div>
              {abilities.canEdit ? (
                <div className="flex flex-wrap gap-1">
                  {(["todo", "doing", "done", "blocked"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy || t.status === s}
                      className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-800"
                      onClick={() =>
                        void run(() =>
                          fetch(
                            `/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/tasks/${encodeURIComponent(t.id)}`,
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
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        {abilities.canEdit ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <input
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white sm:col-span-3"
              placeholder="Task title"
              value={taskDraft.title}
              onChange={(e) => setTaskDraft((d) => ({ ...d, title: e.target.value }))}
            />
            <input
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
              placeholder="Assign to (user id or label)"
              value={taskDraft.assignedTo}
              onChange={(e) => setTaskDraft((d) => ({ ...d, assignedTo: e.target.value }))}
            />
            <input
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
              placeholder="Due (ISO)"
              value={taskDraft.dueAt}
              onChange={(e) => setTaskDraft((d) => ({ ...d, dueAt: e.target.value }))}
            />
            <button
              type="button"
              disabled={busy || !taskDraft.title.trim()}
              className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-50"
              onClick={() =>
                void run(() =>
                  fetch(`/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/tasks`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: taskDraft.title,
                      assignedTo: taskDraft.assignedTo.trim() || undefined,
                      dueAt: taskDraft.dueAt.trim() || undefined,
                    }),
                  })
                ).then((ok) => {
                  if (ok) setTaskDraft({ title: "", assignedTo: "", dueAt: "" });
                })
              }
            >
              Add task
            </button>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-medium text-white">Meetings</h2>
        <ul className="mt-3 space-y-2">
          {bundle.meetings.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 px-3 py-2 text-sm">
              <div>
                <p className="text-white">{m.title}</p>
                <p className="text-xs text-slate-500">
                  {m.provider}
                  {m.scheduledAt ? ` · ${m.scheduledAt}` : ""}
                </p>
              </div>
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                Open link
              </a>
            </li>
          ))}
        </ul>
        {abilities.canEdit ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <select
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
              value={meetingDraft.provider}
              onChange={(e) =>
                setMeetingDraft((d) => ({ ...d, provider: e.target.value as typeof meetingDraft.provider }))
              }
            >
              <option value="manual">Manual URL</option>
              <option value="zoom">Zoom (stub URL)</option>
              <option value="teams">Microsoft Teams (stub URL)</option>
            </select>
            <input
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
              placeholder="Title"
              value={meetingDraft.title}
              onChange={(e) => setMeetingDraft((d) => ({ ...d, title: e.target.value }))}
            />
            <input
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white sm:col-span-2"
              placeholder={meetingDraft.provider === "manual" ? "https://…" : "Optional scheduled time (ISO)"}
              value={meetingDraft.provider === "manual" ? meetingDraft.manualUrl : meetingDraft.scheduledAt}
              onChange={(e) =>
                meetingDraft.provider === "manual"
                  ? setMeetingDraft((d) => ({ ...d, manualUrl: e.target.value }))
                  : setMeetingDraft((d) => ({ ...d, scheduledAt: e.target.value }))
              }
            />
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-indigo-800/90 px-3 py-2 text-sm text-white hover:bg-indigo-700 sm:col-span-2"
              onClick={() =>
                void run(() =>
                  fetch(`/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/meetings`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      provider: meetingDraft.provider,
                      title: meetingDraft.title.trim() || "Meeting",
                      manualUrl: meetingDraft.provider === "manual" ? meetingDraft.manualUrl : undefined,
                      scheduledAt:
                        meetingDraft.provider !== "manual" && meetingDraft.scheduledAt.trim()
                          ? meetingDraft.scheduledAt
                          : undefined,
                    }),
                  })
                ).then((ok) => {
                  if (ok) setMeetingDraft({ provider: "manual", title: "", manualUrl: "", scheduledAt: "" });
                })
              }
            >
              Add meeting
            </button>
          </div>
        ) : null}
      </section>

      <DealRoomDocumentChecklistSection
        roomId={roomId}
        entityType={bundle.room.entityType}
        documentRequirements={bundle.documentRequirements ?? []}
        packetSummary={bundle.packetSummary}
        missingRequiredDocuments={bundle.missingRequiredDocuments ?? []}
        documents={bundle.documents}
        canEdit={abilities.canEdit}
        canReviewDocs={abilities.canReviewDocs}
        busy={busy}
        run={run}
      />

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-medium text-white">Additional document rows</h2>
        <p className="mt-1 text-xs text-slate-500">
          Ad-hoc placeholders and links — use the checklist above for structured packet tracking.
        </p>
        <ul className="mt-3 space-y-2">
          {bundle.documents.map((d) => (
            <li key={d.id} className="rounded-lg border border-slate-800/80 px-3 py-2 text-sm">
              <span className="text-white">{d.title}</span>{" "}
              <span className="text-slate-500">({d.kind})</span>
              {d.url ? (
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-amber-400 hover:underline">
                  Link
                </a>
              ) : null}
            </li>
          ))}
        </ul>
        {abilities.canEdit ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white sm:col-span-2"
              placeholder="Document title"
              value={docDraft.title}
              onChange={(e) => setDocDraft((d) => ({ ...d, title: e.target.value }))}
            />
            <select
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
              value={docDraft.kind}
              onChange={(e) =>
                setDocDraft((d) => ({ ...d, kind: e.target.value as DealRoomDocument["kind"] }))
              }
            >
              <option value="placeholder">Placeholder</option>
              <option value="external_link">External link</option>
              <option value="upload">Upload metadata</option>
            </select>
            <input
              className="rounded border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-white"
              placeholder="URL (optional)"
              value={docDraft.url}
              onChange={(e) => setDocDraft((d) => ({ ...d, url: e.target.value }))}
            />
            <button
              type="button"
              disabled={busy || !docDraft.title.trim()}
              className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 sm:col-span-2"
              onClick={() =>
                void run(() =>
                  fetch(`/api/immo-deal-room/rooms/${encodeURIComponent(roomId)}/documents`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: docDraft.title,
                      kind: docDraft.kind,
                      url: docDraft.url.trim() || undefined,
                    }),
                  })
                ).then((ok) => {
                  if (ok) setDocDraft({ title: "", kind: "placeholder", url: "" });
                })
              }
            >
              Add document row
            </button>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-medium text-white">Activity</h2>
        <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto text-sm">
          {bundle.activities.map((a) => (
            <li key={a.id} className="border-l-2 border-amber-500/40 pl-3 text-slate-300">
              <p>{a.summary}</p>
              <p className="text-[11px] text-slate-500">{a.createdAt}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
