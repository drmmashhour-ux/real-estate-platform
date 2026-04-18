"use client";

export function DeltaHighlights({ lines }: { lines: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-1 text-xs text-zinc-400">
      {(lines.length ? lines : ["—"]).map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}
