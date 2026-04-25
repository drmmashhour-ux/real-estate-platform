"use client";

import { Ear, Heart, Timer } from "lucide-react";

const TIPS = [
  {
    id: "slow",
    icon: Timer,
    labelFr: "Ralentis ici",
    hintEn: "slow down here",
    detail:
      "Après un risque ou le score, laisse 2–3 secondes. Le silence fait accepter la valeur sans que tu en rajoutes.",
  },
  {
    id: "listen",
    icon: Ear,
    labelFr: "Laisse le courtier parler",
    hintEn: "let broker talk",
    detail:
      "Pose une question ouverte, puis écoute. S’il nomme un problème (temps, erreurs, image), tu recadres LECIPM dessus.",
  },
  {
    id: "pain",
    icon: Heart,
    labelFr: "Focus sur leur pain",
    hintEn: "focus on their pain",
    detail:
      "Ne vends pas la fonction : relie chaque écran à ce qu’il craint (risque, perte de contrôle, perte de crédibilité).",
  },
] as const;

export type PsychologyTipsProps = {
  /** Sticky mini-bar useful when scrolling long playbook pages */
  sticky?: boolean;
};

/**
 * Live talking guide — reminders to use during a shared-screen demo.
 */
export function PsychologyTips({ sticky = false }: PsychologyTipsProps) {
  return (
    <aside
      className={
        sticky
          ? "sticky top-[4.5rem] z-10 rounded-2xl border border-amber-500/25 bg-[#0c0c0c]/95 p-4 shadow-lg shadow-black/30 backdrop-blur-md sm:p-5"
          : "rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5"
      }
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Pendant la démo</h3>
      <p className="mt-1 text-[11px] text-zinc-500">Guide live — garde ça dans le champ de vision.</p>
      <ul className="mt-4 space-y-3">
        {TIPS.map(({ id, icon: Icon, labelFr, hintEn, detail }) => (
          <li
            key={id}
            className="flex gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 sm:gap-4 sm:px-4 sm:py-3.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{labelFr}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{hintEn}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
