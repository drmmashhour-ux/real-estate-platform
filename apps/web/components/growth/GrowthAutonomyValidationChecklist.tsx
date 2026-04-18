"use client";

import * as React from "react";

const STORAGE_PREFIX = "growth-autonomy-validation-v1";
const NOTES_KEYS = {
  ok: `${STORAGE_PREFIX}:notesOk`,
  confusing: `${STORAGE_PREFIX}:notesConfusing`,
  followUp: `${STORAGE_PREFIX}:notesFollowUp`,
} as const;

export type GrowthAutonomyValidationChecklistKey =
  | "snapshot_visible"
  | "suggestions_surfaced"
  | "blocked_visible"
  | "frozen_visible"
  | "approval_visible"
  | "prefills_usable"
  | "debug_counts_visible"
  | "no_risky_auto_execution";

const ITEMS: { key: GrowthAutonomyValidationChecklistKey; label: string }[] = [
  { key: "snapshot_visible", label: "Autonomy snapshot visible (or suppressed intentionally with clear reason)" },
  { key: "suggestions_surfaced", label: "Suggestions surfaced where policy allows" },
  { key: "blocked_visible", label: "Blocked states visible and explained" },
  { key: "frozen_visible", label: "Frozen states visible (distinct from blocked)" },
  { key: "approval_visible", label: "Approval-required states visible with routing guidance" },
  { key: "prefills_usable", label: "Prefilled actions open the right panel / copy — no silent mutations" },
  { key: "debug_counts_visible", label: "Debug/status counts visible when debug is on" },
  { key: "no_risky_auto_execution", label: "No risky auto-execution observed (navigate/copy only)" },
];

function readChecks(): Record<GrowthAutonomyValidationChecklistKey, boolean> {
  if (typeof window === "undefined") {
    return Object.fromEntries(ITEMS.map(({ key }) => [key, false])) as Record<
      GrowthAutonomyValidationChecklistKey,
      boolean
    >;
  }
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:checks`);
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    return Object.fromEntries(ITEMS.map(({ key }) => [key, !!parsed[key]])) as Record<
      GrowthAutonomyValidationChecklistKey,
      boolean
    >;
  } catch {
    return Object.fromEntries(ITEMS.map(({ key }) => [key, false])) as Record<
      GrowthAutonomyValidationChecklistKey,
      boolean
    >;
  }
}

function writeChecks(next: Record<GrowthAutonomyValidationChecklistKey, boolean>) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}:checks`, JSON.stringify(next));
  } catch {
    /* noop */
  }
}

function sendTelemetryCompleteOnce() {
  try {
    const k = `${STORAGE_PREFIX}:telemetrySent`;
    if (window.localStorage.getItem(k) === "1") return;
    window.localStorage.setItem(k, "1");
    void fetch("/api/growth/autonomy/telemetry", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "validation_checklist_complete" }),
    }).catch(() => {});
  } catch {
    /* noop */
  }
}

export function GrowthAutonomyValidationChecklist({
  showValidationNotes,
  onAllComplete,
}: {
  showValidationNotes: boolean;
  onAllComplete?: () => void;
}) {
  const [checks, setChecks] = React.useState<Record<GrowthAutonomyValidationChecklistKey, boolean>>(readChecks);
  const [notesOk, setNotesOk] = React.useState("");
  const [notesConfusing, setNotesConfusing] = React.useState("");
  const [notesFollowUp, setNotesFollowUp] = React.useState("");

  React.useEffect(() => {
    setChecks(readChecks());
    if (typeof window === "undefined") return;
    try {
      setNotesOk(window.localStorage.getItem(NOTES_KEYS.ok) ?? "");
      setNotesConfusing(window.localStorage.getItem(NOTES_KEYS.confusing) ?? "");
      setNotesFollowUp(window.localStorage.getItem(NOTES_KEYS.followUp) ?? "");
    } catch {
      /* noop */
    }
  }, []);

  const allDone = ITEMS.every(({ key }) => checks[key]);
  const completionSentRef = React.useRef(false);

  React.useEffect(() => {
    if (allDone && ITEMS.length > 0 && !completionSentRef.current) {
      completionSentRef.current = true;
      sendTelemetryCompleteOnce();
      onAllComplete?.();
    }
    if (!allDone) completionSentRef.current = false;
  }, [allDone, onAllComplete]);

  function toggle(key: GrowthAutonomyValidationChecklistKey) {
    setChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeChecks(next);
      return next;
    });
  }

  function persistNotes(field: keyof typeof NOTES_KEYS, value: string) {
    try {
      window.localStorage.setItem(NOTES_KEYS[field], value);
    } catch {
      /* noop */
    }
  }

  return (
    <section className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5" aria-label="Autonomy validation checklist">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Operator validation checklist</p>
      <ul className="mt-2 space-y-1.5">
        {ITEMS.map(({ key, label }) => (
          <li key={key} className="flex gap-2 text-[11px] text-zinc-300">
            <input
              type="checkbox"
              checked={checks[key]}
              onChange={() => toggle(key)}
              className="mt-0.5 shrink-0 rounded border-zinc-600"
              aria-label={label}
            />
            <span>{label}</span>
          </li>
        ))}
      </ul>
      {showValidationNotes ? (
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Validation notes (internal)</p>
          <label className="block text-[11px] text-zinc-400">
            What looked correct
            <textarea
              className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1.5 text-[11px] text-zinc-200"
              rows={2}
              value={notesOk}
              onChange={(e) => {
                setNotesOk(e.target.value);
                persistNotes("ok", e.target.value);
              }}
            />
          </label>
          <label className="block text-[11px] text-zinc-400">
            What looked confusing
            <textarea
              className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1.5 text-[11px] text-zinc-200"
              rows={2}
              value={notesConfusing}
              onChange={(e) => {
                setNotesConfusing(e.target.value);
                persistNotes("confusing", e.target.value);
              }}
            />
          </label>
          <label className="block text-[11px] text-zinc-400">
            Follow-up needed
            <textarea
              className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1.5 text-[11px] text-zinc-200"
              rows={2}
              value={notesFollowUp}
              onChange={(e) => {
                setNotesFollowUp(e.target.value);
                persistNotes("followUp", e.target.value);
              }}
            />
          </label>
        </div>
      ) : null}
    </section>
  );
}
