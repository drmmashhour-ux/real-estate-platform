type Props = { items: string[] };

export function CriticalBlockersPanel({ items }: Props) {
  if (!items.length) {
    return <p className="text-sm text-zinc-500">No critical blockers recorded.</p>;
  }
  return (
    <ul className="list-inside list-disc space-y-1 text-sm text-red-300">
      {items.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  );
}
