"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { OpsAssistantSuggestion } from "@/modules/platform/ops-assistant/ops-assistant.types";

async function postEvent(
  event: "click" | "confirm" | "cancel" | "complete",
  suggestionId: string,
  priorityId: string,
): Promise<void> {
  try {
    await fetch("/api/platform/ops-assistant/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, suggestionId, priorityId }),
    });
  } catch {
    /* non-blocking */
  }
}

function buildHref(s: OpsAssistantSuggestion): string | null {
  if (!s.href) return null;
  const q = new URLSearchParams();
  if (s.queryParams) {
    for (const [k, v] of Object.entries(s.queryParams)) {
      q.set(k, v);
    }
  }
  const qs = q.toString();
  return qs ? `${s.href}?${qs}` : s.href;
}

export function OpsAssistantSuggestionsClient({
  suggestions,
  priorityId,
  approval,
}: {
  suggestions: OpsAssistantSuggestion[];
  priorityId: string;
  approval?: {
    executionEnabled: boolean;
    panelEnabled: boolean;
    killSwitch: boolean;
  };
}) {
  const router = useRouter();
  const [active, setActive] = useState<OpsAssistantSuggestion | null>(null);
  const [draftText, setDraftText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const approvalPathActive = Boolean(approval?.executionEnabled && !approval?.killSwitch);

  const open = useCallback(
    async (s: OpsAssistantSuggestion) => {
      setMsg(null);
      setActive(s);
      setDraftText(s.prefillData?.text ?? "");
      await postEvent("click", s.id, priorityId);
    },
    [priorityId],
  );

  const close = useCallback(async () => {
    if (active) await postEvent("cancel", active.id, priorityId);
    setActive(null);
  }, [active, priorityId]);

  const submitApprovalRequest = useCallback(async () => {
    if (!active?.executable) return;
    if (
      !window.confirm(
        "Create a pending approval request?\n\nNothing happens until an operator approves it in the queue, then clicks Execute. No product change until then.",
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/platform/ops-assistant/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          priorityId,
          suggestionId: active.id,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(json.error ?? "Could not create approval request.");
        return;
      }
      setMsg("Approval request queued — open the Approval execution queue section above/below to approve and run.");
      await postEvent("confirm", active.id, priorityId);
      setActive(null);
    } finally {
      setBusy(false);
    }
  }, [active, priorityId]);

  const confirm = useCallback(async () => {
    if (!active) return;
    setBusy(true);
    setMsg(null);
    try {
      await postEvent("confirm", active.id, priorityId);
      const navPath = active.href ? buildHref(active) : null;
      if (
        navPath &&
        (active.actionType === "navigate" || (active.actionType === "adjust_setting" && active.href))
      ) {
        router.push(navPath);
        await postEvent("complete", active.id, priorityId);
        setActive(null);
        return;
      }

      const textBlob = draftText.trim() || active.prefillData?.text || "";
      if (
        textBlob &&
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText &&
        (active.actionType === "edit_copy" || (active.actionType === "adjust_setting" && !active.href))
      ) {
        await navigator.clipboard.writeText(textBlob);
        setMsg("Copied to clipboard — paste where you need it.");
        await postEvent("complete", active.id, priorityId);
        setActive(null);
        return;
      }

      setMsg("Nothing to apply — try another suggestion.");
    } finally {
      setBusy(false);
    }
  }, [active, draftText, priorityId, router]);

  if (suggestions.length === 0) {
    return (
      <p className="text-[11px] text-slate-500">
        No assistant suggestions for this priority shape — use Go fix and execution links instead.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-cyan-900/40 bg-cyan-950/15 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-500/90">Suggested actions</p>
      <p className="mt-1 text-[11px] text-slate-500">
        This is a suggested improvement. You stay in control.
      </p>
      <ul className="mt-2 space-y-2">
        {suggestions.map((s) => (
          <li key={s.id} className="rounded border border-slate-800/80 bg-slate-950/40 p-2">
            <p className="text-sm font-medium text-cyan-100">{s.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{s.description}</p>
            {s.executable && approvalPathActive ? (
              <p className="mt-1 text-[10px] text-violet-300/90">
                Executable (internal): this suggestion can queue an approval-based action — still requires approve → run.
              </p>
            ) : null}
            {s.executable && approval?.killSwitch ? (
              <p className="mt-1 text-[10px] text-rose-300/80">Approval execution kill switch is on — use suggest-only.</p>
            ) : null}
            <button
              type="button"
              className="mt-2 rounded border border-cyan-700/50 bg-cyan-950/40 px-2 py-1 text-[11px] text-cyan-200 hover:bg-cyan-900/40"
              onClick={() => void open(s)}
            >
              Try this
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) void close();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-4 shadow-xl">
            <h3 className="text-base font-semibold text-white">{active.title}</h3>
            <p className="mt-1 text-xs text-slate-400">{active.description}</p>
            <p className="mt-2 text-[11px] text-slate-500">
              Nothing changes until you confirm.
            </p>
            <dl className="mt-3 space-y-1 text-[11px] text-slate-500">
              <div>
                <dt className="inline text-slate-500">Action · </dt>
                <dd className="inline text-slate-300">{active.actionType}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Surface · </dt>
                <dd className="inline text-slate-300">{active.targetSurface}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Risk · </dt>
                <dd className="inline text-emerald-400">{active.riskLevel} (assistant never auto-executes)</dd>
              </div>
            </dl>

            {active.executable && approvalPathActive ? (
              <div className="mt-3 rounded border border-violet-800/50 bg-violet-950/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-300">Approval execution</p>
                <p className="mt-1 text-[11px] text-slate-300">{active.executable.expectedOutcome}</p>
                <p className="mt-2 text-[11px] text-amber-200/90">
                  Nothing happens until you approve. This only creates an internal pending request — no automatic product
                  change.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  className="mt-2 rounded bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-600 disabled:opacity-40"
                  onClick={() => void submitApprovalRequest()}
                >
                  Submit approval request…
                </button>
              </div>
            ) : null}

            {(active.actionType === "edit_copy" || active.prefillData?.text) && (
              <label className="mt-3 block text-xs text-slate-400" htmlFor={`ops-prefill-${active.id}`}>
                Prefilled content (edit before confirm)
              </label>
            )}
            {(active.actionType === "edit_copy" || active.prefillData?.text) && (
              <textarea
                id={`ops-prefill-${active.id}`}
                className="mt-1 min-h-[120px] w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
              />
            )}

            {active.prefillData?.configKeyHint ? (
              <p className="mt-2 text-[11px] text-amber-200/90">{active.prefillData.configKeyHint}</p>
            ) : null}

            {active.href && active.actionType === "navigate" ? (
              <p className="mt-2 text-[11px] text-slate-500">
                Suggest-only navigation target: <span className="text-slate-300">{buildHref(active) ?? active.href}</span>
              </p>
            ) : null}

            {msg ? <p className="mt-2 text-xs text-emerald-400">{msg}</p> : null}

            <p className="mt-3 text-[10px] text-slate-500">
              Suggest-only: copy or open a link yourself — does not enqueue execution.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-40"
                onClick={() => void confirm()}
              >
                Confirm
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                onClick={() => void close()}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
