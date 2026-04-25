"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { getConversionCtaMessage } from "@/modules/ai-guide/visitor-guide.agent";

type Surface = "landing" | "dashboard";

type Msg = { role: "user" | "assistant"; text: string };

const QUICK: { label: string; text: string }[] = [
  { label: "What is this platform?", text: "What is LECIPM, in simple terms, for a broker?" },
  { label: "How do I get leads?", text: "How do I get leads and prioritize them in LECIPM?" },
  { label: "How does AI help me?", text: "How does the AI help me day to day? Keep it non-technical." },
];

const VG_SESSION = "lecipm_vg_session_v1";

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let s = sessionStorage.getItem(VG_SESSION);
    if (!s) {
      s = crypto.randomUUID();
      sessionStorage.setItem(VG_SESSION, s);
    }
    return s;
  } catch {
    return null;
  }
}

function postGuideEvent(payload: {
  kind: "cta_click" | "quick_question" | "signup_nav";
  surface: Surface;
  ctaKey?: string;
  questionText?: string;
  label?: string;
}) {
  const sessionId = getSessionId();
  void fetch("/api/ai/visitor-guide/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, sessionId: sessionId ?? undefined }),
  }).catch(() => {});
}

export function VisitorGuideChat({ surface }: { surface: Surface }) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [userTurns, setUserTurns] = React.useState<string[]>([]);
  const [turnIndex, setTurnIndex] = React.useState(0);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendText(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    setLoading(true);
    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");

    const lastUserMessages = userTurns.slice(-4);

    try {
      const res = await fetch("/api/ai/visitor-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: t,
          surface,
          lastUserMessages,
          turnIndex,
          sessionId: getSessionId() ?? undefined,
        }),
      });
      const j = (await res.json()) as { reply?: string; error?: string; intent?: string; ctaUsed?: string };
      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", text: "Something went wrong. Try again in a moment." }]);
        return;
      }
      const reply = j.reply ?? "LECIPM helps you focus on the deals that matter and what to do next.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
      setUserTurns((u) => [...u, t]);
      setTurnIndex((i) => i + 1);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Could not reach the guide. Check your connection." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[80] p-4 sm:p-6">
      <div className="pointer-events-auto ml-auto w-full max-w-sm">
        {open && (
          <div className="mb-3 flex max-h-[min(70vh,520px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/95 text-zinc-100 shadow-2xl shadow-black/50 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Visitor guide
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm whitespace-pre-wrap">
              {messages.length === 0 && (
                <p className="whitespace-normal text-zinc-500">
                  {surface === "landing"
                    ? "Ask anything about LECIPM in plain language — we keep answers short and practical."
                    : "Ask how to use the product day to day. Short answers, no jargon."}
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2 ${m.role === "user" ? "ml-6 bg-amber-500/15 text-white" : "mr-4 bg-white/5 text-zinc-200"}`}
                >
                  {m.text}
                </div>
              ))}
              {loading && <p className="text-xs text-zinc-500">…</p>}
              <div ref={endRef} />
            </div>
            <div className="space-y-2 border-t border-white/10 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Quick</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => {
                      postGuideEvent({ kind: "quick_question", surface, label: q.label, questionText: q.text });
                      void sendText(q.text);
                    }}
                    disabled={loading}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-left text-[11px] text-zinc-200 hover:border-amber-500/30 hover:text-white disabled:opacity-50"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
              <p className="pt-1 text-[11px] text-amber-200/90">{getConversionCtaMessage(surface, turnIndex)}</p>
              {surface === "landing" && (
                <Link
                  href="/signup"
                  className="mt-1 block text-center text-xs font-semibold text-amber-300 underline-offset-2 hover:underline"
                  onClick={() => postGuideEvent({ kind: "signup_nav", surface, ctaKey: "footer_signup" })}
                >
                  Create a broker account
                </Link>
              )}
            </div>
            <form
              className="flex gap-2 border-t border-white/10 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void sendText(input);
              }}
            >
              <input
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                placeholder="Your question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/90 text-black hover:bg-amber-400 disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setOpen((o) => {
              if (!o) postGuideEvent({ kind: "cta_click", surface, ctaKey: "open_widget" });
              return !o;
            });
          }}
          className="ml-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/40 bg-zinc-950/90 text-amber-300 shadow-lg shadow-amber-900/30 transition hover:scale-[1.02] hover:border-amber-400"
          aria-expanded={open}
          aria-label={open ? "Close guide" : "Open visitor guide"}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
