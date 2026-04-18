"use client";

export function ModeHeroSummary({ text }: { text: string }) {
  return <p className="text-sm leading-relaxed text-zinc-200">{text || "—"}</p>;
}
