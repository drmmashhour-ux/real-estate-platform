"use client";

import { useEffect, useState } from "react";

type Entity = "rental_listing" | "rental_application" | "rental_lease" | "platform";

export function RentDecisionAiCard({
  hub,
  entityType,
  entityId,
  title = "AI assistance",
}: {
  hub: "rent" | "admin";
  entityType: Entity;
  entityId: string | null;
  title?: string;
}) {
  const [text, setText] = useState<string | null>(null);
  const [nextAction, setNextAction] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/ai/decision-engine/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            hub,
            entityType,
            entityId: entityId ?? undefined,
            skipLog: false,
          }),
        });
        const j = (await r.json()) as {
          ok?: boolean;
          error?: string;
          result?: { summary?: string; nextBestAction?: string };
        };
        if (!r.ok) throw new Error(j.error ?? "request_failed");
        if (cancelled) return;
        setText(typeof j.result?.summary === "string" ? j.result.summary : null);
        setNextAction(typeof j.result?.nextBestAction === "string" ? j.result.nextBestAction : null);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hub, entityType, entityId]);

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 text-sm text-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">{title}</p>
      {err ? (
        <p className="mt-2 text-sm text-red-200/90">
          {err === "Sign in required" || err.includes("401")
            ? "Sign in to load AI insight."
            : "Something went wrong. Please try again."}
        </p>
      ) : null}
      {!err && text ? <p className="mt-3 leading-relaxed text-slate-300">{text}</p> : null}
      {!err && nextAction ? (
        <p className="mt-3 text-xs text-slate-400">
          <span className="font-medium text-amber-200/90">Next best action:</span> {nextAction}
        </p>
      ) : null}
      {!err && !text ? (
        <div className="mt-3 h-16 animate-pulse rounded-lg bg-white/5" aria-hidden />
      ) : null}
    </div>
  );
}
