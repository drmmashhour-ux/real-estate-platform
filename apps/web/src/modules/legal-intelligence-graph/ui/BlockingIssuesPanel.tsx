export function BlockingIssuesPanel({ issues }: { issues: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Blocking issues</p>
      <ul className="mt-2 space-y-1 text-xs text-rose-200">
        {issues.length ? issues.map((i) => <li key={i}>{i}</li>) : <li className="text-emerald-200">No blocking issues.</li>}
      </ul>
    </div>
  );
}
