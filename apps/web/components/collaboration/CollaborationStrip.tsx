"use client";

import { useCallback, useEffect, useState } from "react";

import type { CollaborationEntityType, CollaborationNote } from "@/modules/collaboration/collaboration.types";

export function CollaborationStrip({
  entityType,
  entityId,
  headline,
}: {
  entityType: CollaborationEntityType;
  entityId: string;
  headline: string;
}) {
  const [notes, setNotes] = useState<CollaborationNote[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      const q = new URLSearchParams({ entityType, entityId });
      const res = await fetch(`/api/collaboration/notes?${q}`, { credentials: "same-origin" });
      const j = (await res.json()) as { notes?: CollaborationNote[] };
      if (res.ok && j.notes) setNotes(j.notes);
    } catch {
      /* ignore */
    }
  }, [entityType, entityId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const createMeeting = async (type: "zoom" | "teams", mode: "now" | "schedule") => {
    setBusy(`${type}-${mode}`);
    setMsg(null);
    try {
      const res = await fetch("/api/collaboration/meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ type, entityType, entityId, mode }),
      });
      const j = (await res.json()) as { session?: { meetingUrl: string }; error?: string };
      if (!res.ok) {
        setMsg(j.error ?? "Could not create meeting link");
        return;
      }
      if (j.session?.meetingUrl) {
        window.open(j.session.meetingUrl, "_blank", "noopener,noreferrer");
        setMsg(type === "zoom" ? "Zoom link opened in a new tab." : "Teams-style link opened in a new tab.");
      }
    } finally {
      setBusy(null);
    }
  };

  const addNote = async () => {
    const body = draft.trim();
    if (!body) return;
    setBusy("note");
    setMsg(null);
    try {
      const res = await fetch("/api/collaboration/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ entityType, entityId, body }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(j.error ?? "Could not save note");
        return;
      }
      setDraft("");
      await loadNotes();
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 text-left">
      <h3 className="text-sm font-semibold text-emerald-100">{headline}</h3>
      <p className="mt-1 text-[11px] text-emerald-200/70">
        Quick links via Zoom (calls) or Teams-style URLs (enterprise). Opens in a new tab — nothing runs in the background.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          className="rounded-lg border border-emerald-700/60 bg-emerald-950/60 px-3 py-1.5 text-xs font-medium text-emerald-50 hover:bg-emerald-900/50 disabled:opacity-40"
          onClick={() => void createMeeting("zoom", "now")}
        >
          Start call
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          className="rounded-lg border border-sky-800/60 bg-sky-950/40 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-900/40 disabled:opacity-40"
          onClick={() => void createMeeting("teams", "schedule")}
        >
          Schedule meeting
        </button>
      </div>
      {msg ? <p className="mt-2 text-[11px] text-emerald-300/90">{msg}</p> : null}

      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Internal notes</p>
        <div className="mt-2 space-y-2">
          {notes.length === 0 ? (
            <p className="text-[11px] text-slate-500">No notes yet — visible to brokers / admins only.</p>
          ) : (
            <ul className="max-h-36 space-y-2 overflow-y-auto text-[11px] text-slate-300">
              {notes.map((n) => (
                <li key={n.id} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                  {n.body}
                  <span className="mt-1 block text-[10px] text-slate-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <textarea
            className="min-h-[56px] w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-white placeholder:text-slate-600"
            placeholder="Add an internal note (not visible to buyers)…"
            value={draft}
            disabled={Boolean(busy)}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            disabled={Boolean(busy) || !draft.trim()}
            className="rounded border border-emerald-800/50 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-950/50 disabled:opacity-40"
            onClick={() => void addNote()}
          >
            Save note
          </button>
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-snug text-slate-500">
        Safety: no platform recording here; no auto-dial; each link is generated only when you click. Recording or calling
        outside the platform is separate and manual.
      </p>
    </section>
  );
}
