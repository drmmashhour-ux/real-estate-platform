"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { DealDocumentStatus, DealPaymentStatus, DealRoomStage, DealTaskStatus } from "@prisma/client";
import { PriorityBadge, StageBadge, stageLabel } from "./deal-room-ui";

type Insight = { kind: string; title: string; detail: string };

export function DealRoomDetailClient({
  dealRoomId,
  initial,
}: {
  dealRoomId: string;
  initial: {
    room: Record<string, unknown>;
    threadPreview: unknown;
    visits: Record<string, unknown>;
    insights: Insight[];
    aiSummary: string;
    recommendedNextAction: string | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const room = initial.room as {
    id: string;
    stage: DealRoomStage;
    priorityLabel: import("@prisma/client").DealPriorityLabel;
    summary: string | null;
    nextAction: string | null;
    nextFollowUpAt: string | null;
    listing: { title: string; listingCode: string } | null;
    lead: { name: string; email: string } | null;
    participants: unknown[];
    tasks: Array<{
      id: string;
      title: string;
      status: DealTaskStatus;
      dueAt: string | null;
    }>;
    events: Array<{ id: string; title: string; eventType: string; body: string | null; createdAt: string }>;
    documents: Array<{ id: string; title: string; status: DealDocumentStatus; documentRefType: string }>;
    payments: Array<{ id: string; paymentType: string; status: DealPaymentStatus; amountCents: number | null }>;
  };

  const threadPreview = initial.threadPreview as {
    source: string;
    messages: Array<{ body?: string; createdAt: string }>;
  } | null;
  const visits = initial.visits as {
    requests: Array<{ id: string; status: string; requestedStart: string }>;
    visits: Array<{ id: string; status: string; startDateTime: string }>;
  };

  const run = useCallback(
    async (path: string, body?: object) => {
      setBusy(true);
      setError(null);
      const res = await fetch(`/api/deal-rooms/${dealRoomId}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
        setBusy(false);
        return;
      }
      setBusy(false);
      router.refresh();
      return data;
    },
    [dealRoomId, router]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <header className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-400">Deal room</p>
              <h1 className="mt-1 text-xl font-semibold text-white">
                {room.lead?.name ?? "Transaction"}{" "}
                {room.listing ? <span className="text-slate-400">· {room.listing.title}</span> : null}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <StageBadge stage={room.stage} />
                <PriorityBadge priority={room.priorityLabel} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link
                href="/dashboard/visits"
                className="rounded-lg border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-800"
              >
                Schedule visit
              </Link>
              <Link
                href="/dashboard/messages"
                className="rounded-lg border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-800"
              >
                Messages
              </Link>
              <Link
                href="/dashboard/forms"
                className="rounded-lg border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-800"
              >
                Form drafts
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
            <span className="text-[11px] text-slate-500">Quick stage:</span>
            {(
              [
                "qualified",
                "visit_scheduled",
                "offer_preparing",
                "negotiating",
                "accepted",
                "documents_pending",
                "payment_pending",
                "closed",
                "lost",
              ] as DealRoomStage[]
            ).map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => run("/stage", { stage: s })}
                className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-800"
              >
                {stageLabel(s)}
              </button>
            ))}
          </div>
        </header>

        {error ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}

        <section className="rounded-xl border border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-200">Timeline</h2>
          <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto text-sm">
            {room.events.map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2">
                <p className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleString()}</p>
                <p className="font-medium text-slate-100">{e.title}</p>
                {e.body ? <p className="mt-1 text-xs text-slate-400">{e.body}</p> : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-200">Tasks</h2>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const title = window.prompt("Task title");
                if (title?.trim()) {
                  void run("/tasks", { title: title.trim() });
                }
              }}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              + Add task
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {room.tasks.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 px-3 py-2"
              >
                <span className="text-slate-200">{t.title}</span>
                <span className="text-xs text-slate-500">
                  {t.status}
                  {t.dueAt ? ` · due ${new Date(t.dueAt).toLocaleDateString()}` : ""}
                </span>
                <button
                  type="button"
                  disabled={busy || t.status === "done"}
                  onClick={() => run(`/tasks/${t.id}`, { status: "done" })}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Mark done
                </button>
              </li>
            ))}
            {room.tasks.length === 0 ? <li className="text-xs text-slate-500">No tasks yet.</li> : null}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-200">Messages (preview)</h2>
          {threadPreview?.messages?.length ? (
            <ul className="mt-2 space-y-2 text-xs text-slate-300">
              {threadPreview.messages.map((m, i) => (
                <li key={i} className="rounded border border-slate-800/80 bg-slate-950/40 px-2 py-1">
                  <span className="text-slate-500">{new Date(m.createdAt).toLocaleString()} — </span>
                  {(m as { body?: string }).body ?? "…"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No linked thread or no messages loaded.</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-200">Visits</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 text-xs">
            <div>
              <p className="text-slate-500">Requests</p>
              <ul className="mt-1 space-y-1 text-slate-300">
                {visits.requests.map((v) => (
                  <li key={v.id}>
                    {v.status} · {new Date(v.requestedStart).toLocaleString()}
                  </li>
                ))}
                {visits.requests.length === 0 ? <li className="text-slate-600">None</li> : null}
              </ul>
            </div>
            <div>
              <p className="text-slate-500">Scheduled / past</p>
              <ul className="mt-1 space-y-1 text-slate-300">
                {visits.visits.map((v) => (
                  <li key={v.id}>
                    {v.status} · {new Date(v.startDateTime).toLocaleString()}
                  </li>
                ))}
                {visits.visits.length === 0 ? <li className="text-slate-600">None</li> : null}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-200">Documents</h2>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const title = window.prompt("Document title");
                if (!title?.trim()) {
                  return;
                }
                void run("/documents", {
                  title: title.trim(),
                  documentType: "general",
                  documentRefType: "external",
                });
              }}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              + Request / track
            </button>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {room.documents.map((d) => (
              <li key={d.id} className="flex flex-wrap justify-between gap-2">
                <span>{d.title}</span>
                <span className="text-slate-500">
                  {d.status} · {d.documentRefType}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI summary</h3>
          <p className="mt-2 text-sm text-slate-300">{initial.aiSummary}</p>
          {initial.recommendedNextAction ? (
            <p className="mt-3 text-xs text-amber-200/90">
              Suggested next step: {initial.recommendedNextAction}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-800 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Insights & risks</h3>
          <ul className="mt-2 space-y-2 text-xs">
            {initial.insights.map((i, idx) => (
              <li
                key={idx}
                className={`rounded-lg border px-2 py-1.5 ${
                  i.kind === "risk"
                    ? "border-red-500/35 bg-red-500/10 text-red-100"
                    : i.kind === "warning"
                      ? "border-amber-500/30 bg-amber-500/5 text-amber-50"
                      : "border-sky-500/25 bg-sky-500/5 text-slate-200"
                }`}
              >
                <p className="font-medium">{i.title}</p>
                <p className="mt-0.5 opacity-90">{i.detail}</p>
              </li>
            ))}
            {initial.insights.length === 0 ? <li className="text-slate-500">No automated flags.</li> : null}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 p-4 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next action</h3>
          <p className="mt-2 text-slate-300">{room.nextAction ?? "—"}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const na = window.prompt("Next action", room.nextAction ?? "");
              if (na !== null) {
                void run("/next-action", { nextAction: na });
              }
            }}
            className="mt-2 text-xs text-amber-400 hover:underline"
          >
            Update
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payments</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {room.payments.map((p) => (
              <li key={p.id}>
                {p.paymentType.replace(/_/g, " ")} — {p.status}
                {p.amountCents != null ? ` · $${(p.amountCents / 100).toFixed(2)}` : ""}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void run("/payments", { paymentType: "deposit", status: "pending" });
            }}
            className="mt-3 text-xs text-amber-400 hover:underline"
          >
            + Add payment row
          </button>
        </div>

        <Link href="/dashboard/deal-rooms" className="inline-block text-xs text-slate-400 hover:text-slate-200">
          ← All deal rooms
        </Link>
      </aside>
    </div>
  );
}
