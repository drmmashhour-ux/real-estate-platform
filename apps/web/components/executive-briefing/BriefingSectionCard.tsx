"use client";

import type { JsonValue } from "@/types/json-value";

export function BriefingSectionCard({
  title,
  sectionKey,
  content,
}: {
  title: string;
  sectionKey: string;
  content: JsonValue;
}) {
  const c =
    content !== null && typeof content === "object" && !Array.isArray(content)
      ? (content as Record<string, unknown>)
      : {};
  const facts = Array.isArray(c.facts) ? (c.facts as string[]) : [];
  const inference = Array.isArray(c.inference) ? (c.inference as string[]) : [];
  const recommendations = Array.isArray(c.recommendations)
    ? (c.recommendations as string[])
    : [];

  return (
    <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
      <div className="text-xs text-zinc-500">{sectionKey}</div>
      <h4 className="text-sm font-semibold text-zinc-100">{title}</h4>
      {facts.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-300">
          {facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      {inference.length > 0 && (
        <div className="mt-2 text-sm text-violet-200/90">
          {inference.map((i) => (
            <p key={i}>{i}</p>
          ))}
        </div>
      )}
      {recommendations.length > 0 && (
        <ul className="mt-2 list-decimal space-y-1 pl-4 text-sm text-emerald-200/90">
          {recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
