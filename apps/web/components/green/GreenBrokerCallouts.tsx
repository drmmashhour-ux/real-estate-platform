"use client";

import { BrokerGreenCallouts } from "@/modules/green-ai/quebec-esg-callouts.service";
import { Zap, Copy, Check, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

interface Props {
  callouts: BrokerGreenCallouts;
}

export function GreenBrokerCallouts({ callouts }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const { showToast } = useToast();

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(id);
    showToast("Copié dans le presse-papier", "success");
    setTimeout(() => setCopied(null), 2000);
  };

  const fullPitch = [
    ...callouts.highlights,
    ...callouts.improvementPitch,
    ...callouts.comparisonInsights,
    ...callouts.incentiveHighlights,
    ...callouts.budgetPitch,
    ...callouts.roiPitch,
    ...callouts.resalePositioning,
  ].join("\n• ");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-gold text-black shadow-lg shadow-premium-gold/20">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Broker Intelligence</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Arguments de vente éco-responsables</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* HIGHLIGHTS */}
        <div className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Points Forts</p>
          <ul className="space-y-3">
            {callouts.highlights.map((item, i) => (
              <li key={i} className="group flex items-start justify-between gap-3">
                <p className="text-xs text-emerald-200/80 leading-relaxed">• {item}</p>
                <button 
                  onClick={() => copyToClipboard(item, `h-${i}`)}
                  className="mt-0.5 text-emerald-500/40 hover:text-emerald-500 transition-colors"
                >
                  {copied === `h-${i}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* IMPROVEMENT PITCH */}
        <div className="space-y-4 rounded-2xl border border-premium-gold/20 bg-premium-gold/5 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-premium-gold">Potentiel de Valorisation</p>
          <ul className="space-y-3">
            {callouts.improvementPitch.map((item, i) => (
              <li key={i} className="group flex items-start justify-between gap-3">
                <p className="text-xs text-premium-gold/80 leading-relaxed">• {item}</p>
                <button 
                  onClick={() => copyToClipboard(item, `p-${i}`)}
                  className="mt-0.5 text-premium-gold/40 hover:text-premium-gold transition-colors"
                >
                  {copied === `p-${i}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* INSIGHTS */}
        <div className="space-y-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Analyse Comparative</p>
          <ul className="space-y-3">
            {callouts.comparisonInsights.map((item, i) => (
              <li key={i} className="group flex items-start justify-between gap-3">
                <p className="text-xs text-blue-200/80 leading-relaxed">• {item}</p>
                <button 
                  onClick={() => copyToClipboard(item, `i-${i}`)}
                  className="mt-0.5 text-blue-500/40 hover:text-blue-500 transition-colors"
                >
                  {copied === `i-${i}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(callouts.incentiveHighlights.length > 0 ||
        callouts.budgetPitch.length > 0 ||
        callouts.roiPitch.length > 0 ||
        callouts.resalePositioning.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {callouts.incentiveHighlights.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Programs & incentives (verify)</p>
              <ul className="space-y-2 text-xs text-cyan-100/80">
                {callouts.incentiveHighlights.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {callouts.budgetPitch.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Budget framing</p>
              <ul className="space-y-2 text-xs text-orange-100/80">
                {callouts.budgetPitch.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {callouts.roiPitch.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">ROI (illustrative)</p>
              <ul className="space-y-2 text-xs text-violet-100/80">
                {callouts.roiPitch.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {callouts.resalePositioning.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-400">Resale positioning</p>
              <ul className="space-y-2 text-xs text-teal-100/80">
                {callouts.resalePositioning.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Texte prêt pour inscription</p>
          <button 
            onClick={() => copyToClipboard(fullPitch, "full")}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
          >
            {copied === "full" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            Copier tout le bloc
          </button>
        </div>
        <div className="rounded-xl bg-black/40 p-4 font-mono text-[10px] leading-relaxed text-zinc-400">
          • {fullPitch}
        </div>
      </div>
    </div>
  );
}
