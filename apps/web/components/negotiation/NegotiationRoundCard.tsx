"use client";

export function NegotiationRoundCard({ round }: { round: { roundNumber: number; status: string } }) {
  return (
    <div className="rounded border border-white/10 px-3 py-2 text-xs text-zinc-300">
      Round {round.roundNumber} — {round.status}
    </div>
  );
}
