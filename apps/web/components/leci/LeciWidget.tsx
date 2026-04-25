"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import type { LeciResponseKind } from "@/modules/leci/escalationEngine";
import { inferHintsFromPathname } from "./infer-leci-context";
import { recordLeciUserQuestion, readLeciFrequentQuestions } from "./leci-memory";
import { useLeciSurface } from "./LeciPlatformContext";

const DISCLAIMER_FR = "Suggestion informative — à valider avec un professionnel au besoin.";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  responseKind?: LeciResponseKind;
  escalated?: boolean;
};

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Bonjour — je suis LECI, ton assisteur sur le brouillon et la conformité. Chaîne : toi / le courtier → LECI (repères + rédaction) → puis remontée obligatoire vers le courtier ou le pro pour décision finale. Je ne signe pas à ta place. Pose une question ou un raccourci ci-dessous.",
};

function LeciEscalationFlow() {
  const steps = [
    { label: "Utilisateur / courtier", sub: "Point d’entrée" },
    { label: "LECI (jumeau IA)", sub: "Assisteur conversationnel" },
    { label: "Brouillon + conformité + guidance", sub: "Produit de l’assistance LECI" },
    { label: "⚠ Remontée — vous / le courtier", sub: "Couche d’escalade humaine" },
    { label: "Validation & décision finales", sub: "Le courtier / le pro tranche" },
  ];
  return (
    <div
      className="mt-3 rounded-xl border border-[#D4AF37]/20 bg-black/50 px-3 py-2.5"
      aria-label="Chaîne LECI : assistance puis escalade humaine"
    >
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Parcours</p>
      <ol className="mt-2 list-none space-y-0">
        {steps.map((s, i) => (
          <li key={s.label}>
            {i > 0 ? (
              <div className="py-1 text-center text-[11px] font-bold text-[#D4AF37]/70" aria-hidden>
                ↓
              </div>
            ) : null}
            <div className="rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1.5">
              <p className="text-[10px] font-semibold leading-snug text-zinc-200">{s.label}</p>
              <p className="text-[9px] text-zinc-500">{s.sub}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const QUICK_ACTIONS: { id: string; label: string; prompt: string }[] = [
  {
    id: "explain",
    label: "Explain this",
    prompt:
      "Explique la section sur laquelle je suis (contexte URL ci-joint) en langage simple pour un client au Québec : points clés, ce que ça engage, sans conseil juridique personnalisé.",
  },
  {
    id: "risk",
    label: "What’s the risk?",
    prompt:
      "Quels sont les risques pratiques typiques à anticiper ici (liste courte) et quoi vérifier avec le courtier — sans dire que c’est une garantie juridique.",
  },
  {
    id: "do",
    label: "What should I do?",
    prompt:
      "Quelle est la prochaine étape prudente pour moi ici (acheteur ou courtier), sans sauter la conformité ni confirmer la légalité ?",
  },
  {
    id: "simplify",
    label: "Simplify this",
    prompt:
      "Simplifie le vocabulaire de ce que je vois à l’écran (contexte URL) en 4–5 phrases pour un non-juriste, sans perdre les nuances de risque.",
  },
];

const KIND_STYLES: Record<LeciResponseKind, string> = {
  explanation: "border-zinc-600/50 text-zinc-400",
  guidance: "border-sky-500/40 text-sky-300/90",
  suggestion: "border-emerald-500/40 text-emerald-300/90",
  warning: "border-amber-500/50 text-amber-200/90",
  escalation: "border-rose-500/50 text-rose-200/90",
};

function ResponseKindBadge({ kind }: { kind?: LeciResponseKind }) {
  if (!kind) return null;
  const label =
    kind === "explanation"
      ? "Explication"
      : kind === "guidance"
        ? "Guidage"
        : kind === "suggestion"
          ? "Suggestion"
          : kind === "warning"
            ? "Avertissement"
            : "Escalade";
  return (
    <span
      className={`mb-1.5 inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${KIND_STYLES[kind]}`}
    >
      {label}
    </span>
  );
}

function LeciFinalValidationBanner() {
  return (
    <div className="mx-3 mt-2 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-3">
      <p className="text-xs font-bold text-rose-100">Validation finale requise</p>
      <p className="mt-1 text-[11px] leading-snug text-rose-200/80">
        Un courtier ou un responsable doit confirmer avant tout engagement définitif.
      </p>
      <div className="mt-2 flex flex-col gap-2">
        <Link
          href="/messages"
          className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-center text-[11px] font-semibold text-zinc-100 hover:bg-white/10"
        >
          Contacter via la messagerie
        </Link>
        <Link
          href="/dashboard/admin"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center text-[11px] font-semibold text-zinc-300 hover:bg-white/10"
        >
          Demander une revue équipe (admin)
        </Link>
      </div>
    </div>
  );
}

function leciEnabled(): boolean {
  if (typeof process.env.NEXT_PUBLIC_LECI_ENABLED === "string") {
    const v = process.env.NEXT_PUBLIC_LECI_ENABLED.trim().toLowerCase();
    if (v === "0" || v === "false" || v === "off") return false;
  }
  return true;
}

export function LeciWidget() {
  const pathname = usePathname() ?? "";
  const { surface } = useLeciSurface();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [frequent, setFrequent] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const enabled = useMemo(() => leciEnabled(), []);

  useEffect(() => {
    setIsDemo(process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1");
  }, []);

  useEffect(() => {
    if (open) setFrequent(readLeciFrequentQuestions().slice(0, 4));
  }, [open]);

  useEffect(() => {
    function onVisitorGuideOpen() {
      setOpen(true);
    }
    window.addEventListener("lecipm-visitor-guide-open", onVisitorGuideOpen);
    return () => window.removeEventListener("lecipm-visitor-guide-open", onVisitorGuideOpen);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sectionHint = useMemo(() => {
    const fromPath = inferHintsFromPathname(pathname);
    const parts = [...fromPath];
    if (surface.sectionLabel) parts.unshift(`Section: ${surface.sectionLabel}`);
    if (surface.focusTopic) parts.unshift(`Sujet: ${surface.focusTopic}`);
    return parts.join(" ");
  }, [pathname, surface.sectionLabel, surface.focusTopic]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      recordLeciUserQuestion(trimmed);
      const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
      setMessages(nextMessages);
      setInput("");
      setLoading(true);
      try {
        const res = await fetch("/api/leci/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            messages: nextMessages,
            context: {
              pathname,
              sectionHint: sectionHint || undefined,
              role: surface.userRole,
              isDemo,
              draftSummary: surface.draftSummary,
              focusTopic: surface.focusTopic,
              complianceState: surface.complianceState,
            },
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          answer?: string;
          error?: string;
          responseKind?: LeciResponseKind;
          escalated?: boolean;
        };
        const answer =
          typeof data.answer === "string" && data.answer.trim()
            ? data.answer.trim()
            : data.error ?? "Réponse indisponible. Réessaie dans un instant.";
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: answer,
            responseKind: data.responseKind,
            escalated: Boolean(data.escalated),
          },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: "Impossible de joindre LECI pour l’instant. Vérifie la connexion ou réessaie.",
            responseKind: "warning",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      messages,
      pathname,
      sectionHint,
      surface.complianceState,
      surface.draftSummary,
      surface.focusTopic,
      surface.userRole,
      isDemo,
    ],
  );

  const showFinalValidation = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    return Boolean(last?.escalated || last?.responseKind === "escalation");
  }, [messages]);

  if (!enabled) return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#D4AF37]/50 bg-[#0a0a0a] text-[#D4AF37] shadow-xl shadow-black/50 transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="Ouvrir LECI — assistant LECIPM"
        >
          <MessageCircle className="h-7 w-7" strokeWidth={1.75} />
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[91] flex items-end justify-end bg-black/50 p-4 sm:items-center sm:p-6"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[min(88vh,680px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-[#050505] shadow-2xl"
            role="dialog"
            aria-labelledby="leci-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div>
                <h2 id="leci-title" className="text-lg font-black tracking-tight text-white">
                  LECI
                </h2>
                <p className="text-[11px] font-medium text-[#D4AF37]/90">Assistant de rédaction et de conformité</p>
                <LeciEscalationFlow />
                {sectionHint ? (
                  <p className="mt-2 line-clamp-2 text-[10px] text-zinc-500" title={sectionHint}>
                    {sectionHint}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex flex-wrap gap-1.5 border-b border-white/10 px-3 py-2">
              {QUICK_ACTIONS.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => void send(q.prompt)}
                  disabled={loading}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-zinc-200 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 disabled:opacity-40"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {showFinalValidation ? <LeciFinalValidationBanner /> : null}

            {frequent.length > 0 ? (
              <div className="flex flex-wrap gap-1 border-b border-white/5 px-3 py-2">
                <span className="w-full text-[9px] font-bold uppercase tracking-wide text-zinc-600">Récents</span>
                {frequent.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(q)}
                    disabled={loading}
                    className="max-w-full truncate rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
                    title={q}
                  >
                    {q.length > 42 ? `${q.slice(0, 40)}…` : q}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {messages.map((msg, i) => (
                <div
                  key={`${i}-${msg.role}-${msg.content.slice(0, 12)}`}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "border border-[#D4AF37]/30 bg-[#D4AF37]/12 text-zinc-100"
                        : "border border-white/10 bg-white/[0.06] text-zinc-200"
                    }`}
                  >
                    {msg.role === "assistant" ? <ResponseKindBadge kind={msg.responseKind} /> : null}
                    {msg.content}
                    {msg.role === "assistant" ? (
                      <p className="mt-2 border-t border-white/10 pt-2 text-[10px] text-zinc-500">{DISCLAIMER_FR}</p>
                    ) : null}
                  </div>
                </div>
              ))}
              {loading ? (
                <p className="text-center text-xs text-zinc-500">LECI réfléchit…</p>
              ) : null}
              <div ref={endRef} />
            </div>

            <form
              className="flex gap-2 border-t border-white/10 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <input
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[#D4AF37]/50 focus:outline-none"
                placeholder="Ex. C’est quoi garantie légale ?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={4000}
                disabled={loading}
                aria-label="Message à LECI"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25 disabled:opacity-40"
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
