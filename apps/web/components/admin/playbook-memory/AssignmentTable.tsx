type A = { id: string; domain: string; playbookId: string; selectionMode: string; outcomeStatus: string | null; createdAt: string };

export function AssignmentTable({ assignments }: { assignments: A[] }) {
  if (!assignments.length) {
    return <p className="text-sm text-white/50">No recent assignments.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-black/50 text-xs uppercase text-white/50">
          <tr>
            <th className="p-2">Time</th>
            <th className="p-2">Playbook</th>
            <th className="p-2">Domain</th>
            <th className="p-2">Mode</th>
            <th className="p-2">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id} className="border-t border-white/5 text-white/80">
              <td className="p-2 text-xs text-white/50">{a.createdAt}</td>
              <td className="p-2 font-mono text-xs">{a.playbookId}</td>
              <td className="p-2">{a.domain}</td>
              <td className="p-2">{a.selectionMode}</td>
              <td className="p-2 text-white/60">{a.outcomeStatus ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
