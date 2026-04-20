"use client";

export function ExplanationFindingsList(props: { findings: string[] }) {
  if (props.findings.length === 0) {
    return (
      <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-500">
        No key findings for this preview window.
      </p>
    );
  }
  return (
    <ul className="list-inside list-disc space-y-1 text-xs text-zinc-300">
      {props.findings.map((f) => (
        <li key={f}>{f}</li>
      ))}
    </ul>
  );
}
