"use client";

export function ExplanationRecommendations(props: { items: string[] }) {
  if (props.items.length === 0) {
    return <p className="text-xs text-zinc-500">No advisory recommendations from this preview.</p>;
  }
  return (
    <ol className="list-inside list-decimal space-y-1 text-xs text-zinc-300">
      {props.items.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ol>
  );
}
