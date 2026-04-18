export function NegotiationRiskCard({ flags }: { flags: { code: string; message: string; severity: string }[] }) {
  if (flags.length === 0) return null;
  return (
    <ul className="space-y-2 text-sm">
      {flags.map((f) => (
        <li key={f.code} className="rounded-lg border border-amber-500/25 bg-black/30 px-3 py-2 text-amber-100/85">
          {f.message}
        </li>
      ))}
    </ul>
  );
}
