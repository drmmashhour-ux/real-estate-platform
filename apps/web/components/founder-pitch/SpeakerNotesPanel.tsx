"use client";

export function SpeakerNotesPanel({ notes }: { notes: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">Speaker notes</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{notes}</p>
    </div>
  );
}
