type Props = { items: string[] };

export function DreamHomeTradeoffs({ items }: Props) {
  if (!items.length) {
    return null;
  }
  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Tradeoffs</h2>
      <ul className="mt-2 list-inside list-disc text-slate-400">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
