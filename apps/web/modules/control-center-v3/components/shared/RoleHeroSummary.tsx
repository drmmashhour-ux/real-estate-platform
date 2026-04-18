"use client";

export function RoleHeroSummary({ text }: { text: string }) {
  if (!text.trim()) {
    return <p className="text-sm text-zinc-500">No summary available.</p>;
  }
  return <p className="text-sm leading-relaxed text-zinc-200">{text}</p>;
}
