type Version = { id: string; versionNumber: number; createdBy: string; createdAt: string | Date };

export function DocumentVersionPanel({ versions }: { versions: Version[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Versions</p>
      <ul className="mt-2 space-y-1 text-xs text-slate-300">
        {versions.length ? versions.map((v) => <li key={v.id}>v{v.versionNumber} · {v.createdBy}</li>) : <li className="text-slate-500">No versions yet.</li>}
      </ul>
    </div>
  );
}
