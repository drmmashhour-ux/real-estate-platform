"use client";

import * as React from "react";
import type { GrowthContentHubSnapshot } from "@/modules/growth/ai-autopilot-content.types";
import type { GrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.types";
import { buildContentHub } from "@/modules/growth/ai-autopilot-content-hub.service";
import { applyPolicyToContentAssist } from "@/modules/growth/growth-policy-enforcement-bridge.service";

function toneClass(tone: string): string {
  if (tone === "high-conversion") return "border-amber-500/40 bg-amber-950/30 text-amber-100";
  if (tone === "professional") return "border-sky-500/35 bg-sky-950/25 text-sky-100";
  return "border-emerald-500/35 bg-emerald-950/25 text-emerald-100";
}

function DraftCard({
  draft,
  onCopy,
}: {
  draft: import("@/modules/growth/ai-autopilot-content.types").AiContentDraft;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${toneClass(draft.tone)}`}>
          {draft.tone}
        </span>
        <span className="text-[10px] uppercase text-zinc-500">{draft.variant}</span>
        <button
          type="button"
          onClick={onCopy}
          className="ml-auto text-[11px] text-emerald-400 hover:text-emerald-300"
        >
          Copy
        </button>
      </div>
      {draft.title ? <p className="mt-2 text-sm font-semibold text-zinc-100">{draft.title}</p> : null}
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{draft.body}</p>
      <p className="mt-2 text-[11px] text-zinc-500">{draft.rationale}</p>
    </div>
  );
}

export function GrowthContentStudioPanel({
  snapshot,
  enforcementSnapshot,
}: {
  snapshot: GrowthContentHubSnapshot;
  enforcementSnapshot?: GrowthPolicyEnforcementSnapshot | null;
}) {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const hub = React.useMemo(() => buildContentHub(snapshot, { refreshKey }), [snapshot, refreshKey]);

  const contentGate = React.useMemo(
    () => applyPolicyToContentAssist(enforcementSnapshot ?? null),
    [enforcementSnapshot],
  );

  const total = hub.adCopy.length + hub.listingCopy.length + hub.outreachCopy.length;

  const batchLogged = React.useRef(false);
  React.useEffect(() => {
    if (total <= 0 || batchLogged.current) return;
    batchLogged.current = true;
    void fetch("/api/growth/content-assist/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ event: "batch", count: total }),
    });
  }, [total]);

  const copyDraft = React.useCallback(async (draft: import("@/modules/growth/ai-autopilot-content.types").AiContentDraft) => {
    const text = [draft.title, draft.body].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      await fetch("/api/growth/content-assist/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ event: "copy", draftId: draft.id, type: draft.type }),
      });
    } catch {
      /* clipboard */
    }
  }, []);

  const onRegenerate = React.useCallback(() => {
    setRefreshKey((k) => k + 1);
    void fetch("/api/growth/content-assist/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ event: "regenerate" }),
    });
  }, []);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-zinc-200">Content Studio</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Enable content assist and sub-flags (ad / listing / outreach) to generate drafts here. Nothing is published
          automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-violet-900/40 bg-violet-950/15 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Content Studio — draft assist</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Drafts only — copy and edit before use. No auto-publish, no ads API calls, no messages sent.
          </p>
          {contentGate.readOnlyNotice ? (
            <p className="mt-2 text-[11px] text-amber-200/85">{contentGate.readOnlyNotice}</p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={contentGate.suppressRegenerateTriggers}
          onClick={onRegenerate}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Regenerate variants
        </button>
      </div>

      <div className="mt-6 space-y-8">
        {hub.adCopy.length > 0 ? (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">🎯 Ad copy</h4>
            <div className="mt-3 space-y-3">
              {hub.adCopy.map((d) => (
                <DraftCard key={d.id} draft={d} onCopy={() => void copyDraft(d)} />
              ))}
            </div>
          </section>
        ) : null}

        {hub.listingCopy.length > 0 ? (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">🏠 Listing copy</h4>
            <div className="mt-3 space-y-3">
              {hub.listingCopy.map((d) => (
                <DraftCard key={d.id} draft={d} onCopy={() => void copyDraft(d)} />
              ))}
            </div>
          </section>
        ) : null}

        {hub.outreachCopy.length > 0 ? (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">💬 Outreach copy</h4>
            <div className="mt-3 space-y-3">
              {hub.outreachCopy.map((d) => (
                <DraftCard key={d.id} draft={d} onCopy={() => void copyDraft(d)} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
