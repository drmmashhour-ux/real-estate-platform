export function PPtoCPDiffCard({ changedKeys, notes }: { changedKeys: string[]; notes: string[] }) {
  return (
    <div className="rounded-xl border border-ds-border bg-ds-card/40 p-4">
      <h4 className="text-sm font-medium text-ds-text">PP ↔ CP structured diff (hints)</h4>
      {changedKeys.length === 0 ? (
        <p className="mt-2 text-xs text-ds-text-secondary">{notes[0] ?? "No diff data."}</p>
      ) : (
        <ul className="mt-2 list-inside list-disc text-sm text-ds-text-secondary">
          {changedKeys.slice(0, 24).map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
