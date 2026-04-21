"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import type { AssistantPriority, AssistantSuggestion, AssistantSuggestionType } from "@/modules/assistant/assistant.types";

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
  const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>([]);

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
      const data = await res.json() as { suggestions?: AssistantSuggestion[]; disclaimer?: string };
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setDisclaimer(typeof data.disclaimer === "string" ? data.disclaimer : null);
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

  return (
    <div className="pointer-events-auto fixed bottom-6 start-6 z-[45] flex max-w-[min(100vw-3rem,22rem)] flex-col gap-2 sm:bottom-8 sm:start-8">
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
            Suggestions only — no auto-send
          </p>

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
                    {sorted.map((s, idx) => (
                      <li
                        key={`${type}-${idx}-${s.message.slice(0, 24)}`}
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
                        </div>
                        <p className="leading-snug text-foreground">{s.message}</p>
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
