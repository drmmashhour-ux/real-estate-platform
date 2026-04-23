"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { AssistantActionConfirmModal } from "@/components/assistant/AssistantActionConfirmModal";
import type {
  AssistantPriority,
  AssistantSuggestion,
  AssistantSuggestionType,
} from "@/modules/assistant/assistant.types";
import type { BrokerAssistantSafetyMode } from "@/modules/assistant/assistant-safety";

function extractDashboardContext(pathname: string): { dealId?: string; leadId?: string } {
  const dealMatch = pathname.match(/\/dashboard\/deals\/([^/]+)/);
  const leadMatch = pathname.match(/\/dashboard\/leads\/([^/]+)/);
  return {
    dealId: dealMatch?.[1],
    leadId: leadMatch?.[1],
  };
}

const PRIORITY_ORDER: AssistantPriority[] = ["HIGH", "MEDIUM", "LOW"];

function priorityBars(priority: AssistantPriority): number {
  switch (priority) {
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    default:
      return 1;
  }
}

function typeLabel(type: AssistantSuggestionType): string {
  switch (type) {
    case "ACTION":
      return "Actions";
    case "ALERT":
      return "Alerts";
    default:
      return "Reminders";
  }
}

export function BrokerAssistantFloating() {
  const pathname = usePathname() ?? "";
  const { dealId, leadId } = useMemo(() => extractDashboardContext(pathname), [pathname]);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [assistantMode, setAssistantMode] = useState<BrokerAssistantSafetyMode | null>(null);
  const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());
  const [confirmSuggestion, setConfirmSuggestion] = useState<AssistantSuggestion | null>(null);
  const [execLoading, setExecLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dealId) params.set("dealId", dealId);
      if (leadId) params.set("leadId", leadId);
      const q = params.toString();
      const res = await fetch(`/api/assistant/suggestions${q ? `?${q}` : ""}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body?.error === "string" ? body.error : "Could not load assistant");
        setSuggestions([]);
        return;
      }
      const data = await res.json() as {
        suggestions?: AssistantSuggestion[];
        disclaimer?: string;
        assistantMode?: BrokerAssistantSafetyMode;
      };
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setDisclaimer(typeof data.disclaimer === "string" ? data.disclaimer : null);
      setAssistantMode(typeof data.assistantMode === "string" ? data.assistantMode : null);
    } catch {
      setError("Network error");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [dealId, leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(), 120_000);
    return () => window.clearInterval(id);
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<AssistantSuggestionType, AssistantSuggestion[]>();
    for (const s of suggestions) {
      const list = map.get(s.type) ?? [];
      list.push(s);
      map.set(s.type, list);
    }
    return map;
  }, [suggestions]);

  const typesOrder: AssistantSuggestionType[] = ["ACTION", "ALERT", "REMINDER"];

  const showExecute = assistantMode === "SAFE_AUTOPILOT" || assistantMode === "FULL_AUTOPILOT";

  async function runExecute(s: AssistantSuggestion, confirmed: boolean) {
    if (!s.actionType || !s.actionPayload) return;
    setExecLoading(true);
    setToast(null);
    try {
      const res = await fetch("/api/assistant/execute", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: s.actionType,
          actionPayload: s.actionPayload,
          confirmed,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setFailedIds((prev) => new Set(prev).add(s.id));
        setToast(typeof data.message === "string" ? data.message : "Action failed");
        return;
      }
      setDoneIds((prev) => new Set(prev).add(s.id));
      setToast(typeof data.message === "string" ? data.message : "Done");
      if (data.result?.deepLink && typeof data.result.deepLink === "string") {
        window.open(data.result.deepLink, "_blank", "noopener,noreferrer");
      }
    } catch {
      setFailedIds((prev) => new Set(prev).add(s.id));
      setToast("Network error");
    } finally {
      setExecLoading(false);
      setConfirmSuggestion(null);
    }
  }

  function onExecuteClick(s: AssistantSuggestion) {
    if (!s.actionType) return;
    if (s.requiresConfirmation === false) {
      void runExecute(s, true);
      return;
    }
    setConfirmSuggestion(s);
  }

  return (
    <div className="pointer-events-auto fixed bottom-6 start-6 z-[45] flex max-w-[min(100vw-3rem,22rem)] flex-col gap-2 sm:bottom-8 sm:start-8">
      <AssistantActionConfirmModal
        open={Boolean(confirmSuggestion)}
        suggestion={confirmSuggestion}
        loading={execLoading}
        onCancel={() => setConfirmSuggestion(null)}
        onConfirm={() => {
          if (confirmSuggestion) void runExecute(confirmSuggestion, true);
        }}
      />

      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void load();
        }}
        className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--foreground)_18%,transparent)] bg-[color-mix(in_oklab,var(--card)_92%,transparent)] px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md transition hover:bg-[color-mix(in_oklab,var(--card)_85%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-premium-gold"
        aria-expanded={open}
        aria-controls="broker-assistant-panel"
      >
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-premium-gold/60 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-premium-gold" />
        </span>
        Broker assistant
        {suggestions.length > 0 ? (
          <span className="rounded-full bg-premium-gold/20 px-2 py-0.5 text-xs font-semibold text-premium-gold">
            {suggestions.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id="broker-assistant-panel"
          role="region"
          aria-label="Broker assistant suggestions"
          className="max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-[color-mix(in_oklab,var(--foreground)_15%,transparent)] bg-[color-mix(in_oklab,var(--card)_95%,transparent)] p-4 text-sm shadow-xl backdrop-blur-md"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {assistantMode === "ASSIST"
              ? "Assist mode — suggestions only"
              : assistantMode === "OFF"
                ? "Assistant off"
                : "Confirm before any outbound action"}
          </p>

          {toast ? (
            <p className="mb-2 rounded-md bg-muted/50 px-2 py-1 text-xs text-foreground" role="status">
              {toast}
            </p>
          ) : null}

          {loading && suggestions.length === 0 ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : null}
          {error ? <p className="text-destructive">{error}</p> : null}

          {!loading && !error && suggestions.length === 0 ? (
            <p className="text-muted-foreground">No suggestions right now.</p>
          ) : null}

          <div className="flex flex-col gap-4">
            {typesOrder.map((type) => {
              const items = grouped.get(type);
              if (!items?.length) return null;
              const sorted = [...items].sort(
                (a, b) =>
                  PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
              );
              return (
                <section key={type} aria-labelledby={`assist-${type}`}>
                  <h3 id={`assist-${type}`} className="mb-2 text-xs font-semibold text-foreground">
                    {typeLabel(type)}
                  </h3>
                  <ul className="space-y-2">
                    {sorted.map((s) => (
                      <li
                        key={s.id}
                        className="rounded-lg border border-[color-mix(in_oklab,var(--foreground)_10%,transparent)] bg-background/40 p-3"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="sr-only">Priority {s.priority}</span>
                          <span className="flex gap-0.5" aria-hidden>
                            {Array.from({ length: 3 }, (_, i) => (
                              <span
                                key={i}
                                className={`h-1 w-4 rounded-full ${
                                  i < priorityBars(s.priority)
                                    ? "bg-premium-gold"
                                    : "bg-muted-foreground/25"
                                }`}
                              />
                            ))}
                          </span>
                          <span className="text-[10px] font-medium uppercase text-muted-foreground">
                            {s.priority}
                          </span>
                          {doneIds.has(s.id) ? (
                            <span className="text-[10px] font-medium text-emerald-600">Done</span>
                          ) : null}
                          {failedIds.has(s.id) ? (
                            <span className="text-[10px] font-medium text-destructive">Failed</span>
                          ) : null}
                        </div>
                        <p className="leading-snug text-foreground">{s.message}</p>
                        {showExecute && s.actionType && s.actionPayload && !doneIds.has(s.id) ? (
                          <button
                            type="button"
                            className="mt-2 rounded-md border border-premium-gold/40 bg-premium-gold/10 px-2 py-1 text-xs font-medium text-premium-gold hover:bg-premium-gold/20"
                            onClick={() => onExecuteClick(s)}
                          >
                            Execute…
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          {disclaimer ? (
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground leading-relaxed">
              {disclaimer}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
