export type PendingApprovalRow = {
  id: string;
  proposedActionId: string;
  governanceDisposition: string;
  createdAt: string;
};

export function PendingApprovalTable(props: { items: PendingApprovalRow[] }) {
  if (!props.items.length) {
    return <p className="text-sm text-slate-500">No pending approvals.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="min-w-full text-left text-sm text-slate-300">
        <thead className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Approval id</th>
            <th className="px-3 py-2">Action id</th>
            <th className="px-3 py-2">Governance</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {props.items.map((r) => (
            <tr key={r.id} className="border-b border-slate-800/80">
              <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.proposedActionId}</td>
              <td className="px-3 py-2">{r.governanceDisposition}</td>
              <td className="px-3 py-2 text-slate-400">{r.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
