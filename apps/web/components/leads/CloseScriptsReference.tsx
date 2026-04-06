"use client";

import { useMemo, useState } from "react";
import {
  CONVERSION_OBJECTION_GOLDEN_RULE,
  CONVERSION_OBJECTIONS,
  objectionFullSequence,
  objectionMessage1,
  objectionMessage2,
} from "@/lib/leads/conversion-objections";
import {
  BROKER_MONETIZATION_SCRIPT,
  BROKER_RECOMMENDED_PITCH,
  BROKER_REVENUE_MODELS,
  BUYER_CLOSE_SCRIPT,
  defaultPlatformLinkForScripts,
  personalizeCloseScript,
  type CloseScriptStage,
} from "@/lib/leads/close-scripts";

function StageBlock({
  stage,
  leadName,
  platformLink,
}: {
  stage: CloseScriptStage;
  leadName: string;
  platformLink: string;
}) {
  const [open, setOpen] = useState(false);

  const mainText = useMemo(() => {
    if (!stage.body.trim() && stage.branches?.length) return "";
    return personalizeCloseScript(stage.body, { name: leadName, link: platformLink });
  }, [stage.body, stage.branches, leadName, platformLink]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/25">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold text-premium-gold hover:bg-white/5"
      >
        <span>{stage.title}</span>
        <span className="text-[#737373]">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="space-y-2 border-t border-white/10 px-3 py-2 text-[11px] leading-relaxed text-[#D1D5DB]">
          {mainText ? (
            <div>
              <pre className="whitespace-pre-wrap font-sans">{mainText}</pre>
              <button
                type="button"
                onClick={() => void copy(mainText)}
                className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 hover:text-emerald-300"
              >
                Copy
              </button>
            </div>
          ) : null}
          {stage.branches?.map((b) => {
            const t = personalizeCloseScript(b.body, { name: leadName, link: platformLink });
            return (
              <div key={b.id} className="rounded-md border border-white/5 bg-black/20 p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{b.label}</p>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-[#E5E7EB]">{t}</pre>
                <button
                  type="button"
                  onClick={() => void copy(t)}
                  className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 hover:text-emerald-300"
                >
                  Copy
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function CloseScriptsReference({ leadName }: { leadName: string }) {
  const platformLink = useMemo(() => defaultPlatformLinkForScripts(), []);

  return (
    <section className="mb-4 rounded-2xl border border-premium-gold/25 bg-[#141008]/80 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-premium-gold/90">Close scripts</p>
      <p className="mt-1 text-xs text-[#9CA3AF]">
        Qualify → understand → match → <span className="text-white">one action</span>. Short. Forward. No passive
        endings.
      </p>

      <details className="mt-3 group">
        <summary className="cursor-pointer text-sm font-semibold text-white hover:text-premium-gold">
          Buyer: browsing → inquiry → deal
        </summary>
        <div className="mt-2 space-y-2">
          <p className="text-[10px] text-[#737373]">
            Link prefilled: <span className="font-mono text-[#A3A3A3]">{platformLink}</span>
          </p>
          {BUYER_CLOSE_SCRIPT.map((s) => (
            <StageBlock key={s.id} stage={s} leadName={leadName} platformLink={platformLink} />
          ))}
        </div>
      </details>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-white hover:text-rose-200/90">
          Objection handling (1–2 messages)
        </summary>
        <div className="mt-2 space-y-2">
          <p className="rounded-lg border border-rose-500/20 bg-rose-950/20 px-3 py-2 text-[11px] text-[#FCA5A5]/95">
            {CONVERSION_OBJECTION_GOLDEN_RULE}
          </p>
          {CONVERSION_OBJECTIONS.map((o) => {
            const m1 = objectionMessage1(o);
            const m2 = objectionMessage2(o);
            const full = objectionFullSequence(o);
            return (
              <div key={o.id} className="rounded-lg border border-white/10 bg-black/25">
                <p className="border-b border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-rose-200/80">
                  {o.trigger}
                </p>
                <div className="space-y-2 px-3 py-2 text-[11px] text-[#D1D5DB]">
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF]">Message 1 — acknowledge + question</p>
                    <pre className="mt-1 whitespace-pre-wrap font-sans">{m1}</pre>
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard.writeText(m1)}
                      className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 hover:text-emerald-300"
                    >
                      Copy
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF]">Message 2 — one action</p>
                    <pre className="mt-1 whitespace-pre-wrap font-sans">{m2}</pre>
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard.writeText(m2)}
                      className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 hover:text-emerald-300"
                    >
                      Copy
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(full)}
                    className="text-[10px] font-bold uppercase tracking-wide text-premium-gold hover:opacity-90"
                  >
                    Copy full sequence
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </details>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-white hover:text-premium-gold">
          Broker: deal flow &amp; monetization
        </summary>
        <div className="mt-2 space-y-2">
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] text-[#B3B3B3]">
            <p className="font-semibold text-amber-200/90">Position</p>
            <p className="mt-1">You are a deal flow provider — not a free lead generator. They care: deal flow, speed, ROI.</p>
            <p className="mt-2 font-semibold text-amber-200/90">Models</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              {BROKER_REVENUE_MODELS.map((m) => (
                <li key={m.id}>
                  <span className="text-white">{m.title}</span> — {m.range}. Best for: {m.bestFor}.
                </li>
              ))}
            </ul>
            <p className="mt-2 text-emerald-200/90">{BROKER_RECOMMENDED_PITCH}</p>
          </div>
          {BROKER_MONETIZATION_SCRIPT.map((s) => (
            <StageBlock key={s.id} stage={s} leadName={leadName} platformLink={platformLink} />
          ))}
        </div>
      </details>

      <div className="mt-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] text-[#9CA3AF]">
        <span className="font-semibold text-premium-gold">Today</span>: 20 buyer touches · 5 broker touches · push 1
        inquiry · 1 broker connection.
      </div>
    </section>
  );
}
