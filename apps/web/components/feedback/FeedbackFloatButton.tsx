"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getPublicContactMailto } from "@/lib/marketing-contact";
import { suppressGlobalMarketingOverlays } from "@/lib/ui/dev-overlays";

const SUBMITTED_LS = "lecipm_feedback_submitted_at";
const TIMER_MS = 100_000; // ~1.7 min (between 1–2 minutes)

function shouldSuppressAutoPrompt(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(SUBMITTED_LS);
  if (!raw) return false;
  const t = parseInt(raw, 10);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 7 * 86400000;
}

/**
 * Global feedback entry — bottom-left (call/WhatsApp stay bottom-right).
 * POST /api/feedback with rating + optional message. Triggers after analysis, save, or ~2 min on site.
 */
export function FeedbackFloatButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  /** 0 = not chosen */
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setStatus("idle");
    setErrMsg(null);
    setRating(0);
    setMessage("");
  }, []);

  const tryOpenFromEvent = useCallback((reason: string) => {
    const isAuto =
      reason === "analysis_complete" || reason === "deal_saved" || reason === "timer";
    if (isAuto && shouldSuppressAutoPrompt()) return;
    if (reason === "analysis_complete") {
      if (sessionStorage.getItem("lecipm_fb_prompt_analysis")) return;
      sessionStorage.setItem("lecipm_fb_prompt_analysis", "1");
    } else if (reason === "deal_saved") {
      if (sessionStorage.getItem("lecipm_fb_prompt_save")) return;
      sessionStorage.setItem("lecipm_fb_prompt_save", "1");
    } else if (reason === "timer") {
      if (sessionStorage.getItem("lecipm_fb_prompt_timer")) return;
      sessionStorage.setItem("lecipm_fb_prompt_timer", "1");
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ reason?: string }>;
        const reason = ce.detail?.reason ?? "manual";
        tryOpenFromEvent(reason);
      } catch {
        setOpen(true);
      }
    };
    window.addEventListener("lecipm-open-feedback", onOpen);
    return () => window.removeEventListener("lecipm-open-feedback", onOpen);
  }, [tryOpenFromEvent]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("lecipm-open-feedback", { detail: { reason: "timer" } }));
    }, TIMER_MS);
    return () => window.clearTimeout(id);
  }, []);

  const submit = useCallback(async () => {
    if (rating < 1 || rating > 5) {
      setErrMsg("Please select a star rating (1–5).");
      return;
    }
    const path =
      typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : pathname ?? "";
    setStatus("sending");
    setErrMsg(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          message: message.trim() || undefined,
          page: path.slice(0, 512),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("err");
        setErrMsg(data.error ?? "Feature loading, please try again");
        return;
      }
      setStatus("ok");
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(SUBMITTED_LS, String(Date.now()));
      }
      window.setTimeout(() => {
        close();
      }, 2200);
    } catch {
      setStatus("err");
      setErrMsg("Feature loading, please try again");
    }
  }, [rating, message, pathname, close]);

  if (suppressGlobalMarketingOverlays()) return null;
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/embed") || pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <>
      <div className="pointer-events-auto fixed bottom-6 start-6 z-50 sm:bottom-8 sm:start-8">
        <button
          type="button"
          onClick={() => {
            setErrMsg(null);
            setOpen(true);
          }}
          className="pointer-events-auto z-50 rounded-full border border-emerald-500/40 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all duration-200 hover:scale-105 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-[#0B0B0B]"
        >
          Feedback
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#121212] p-6 shadow-2xl transition-all duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Feedback</p>
                <h2 id="feedback-modal-title" className="mt-1 text-xl font-bold text-white">
                  Rate your experience
                </h2>
                <p className="mt-1 text-sm text-slate-400">Your feedback helps us improve LECIPM for everyone.</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-400 hover:border-white/30 hover:text-white"
              >
                Close
              </button>
            </div>

            {status === "ok" ? (
              <p className="mt-8 text-center text-lg font-semibold text-emerald-100" role="status">
                Thank you for your feedback!
              </p>
            ) : (
              <>
                <div className="mt-6">
                  <span className="text-sm font-medium text-slate-200">Your rating</span>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Star rating 1 to 5">
                    {([1, 2, 3, 4, 5] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className={`h-11 min-w-[2.5rem] rounded-xl border text-base font-semibold transition-all duration-200 hover:scale-105 ${
                          rating === n
                            ? "border-amber-400 bg-amber-500/25 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                            : "border-white/15 text-slate-400 hover:border-white/30 hover:text-white"
                        }`}
                        aria-pressed={rating === n}
                        aria-label={`${n} stars`}
                      >
                        ★ {n}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="mt-5 block">
                  <span className="text-sm font-medium text-slate-200">What can we improve?</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="mt-1.5 w-full resize-y rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Optional — tell us what would make the platform better for you"
                  />
                </label>

                {errMsg ? <p className="mt-3 text-sm text-red-400">{errMsg}</p> : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={status === "sending"}
                    onClick={() => void submit()}
                    className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {status === "sending" ? "Sending…" : "Submit feedback"}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-xl border border-white/20 px-5 py-2.5 text-sm text-slate-300 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            <p className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-slate-500">
              Need help?{" "}
              <a href={getPublicContactMailto()} className="text-emerald-400 hover:underline">
                Contact us
              </a>{" "}
              ·{" "}
              <a href="/contact" className="text-slate-400 hover:text-white hover:underline">
                Contact page
              </a>
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
