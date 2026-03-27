import type { CommissionStatus } from "@prisma/client";

export type SplitRow = {
  id: string;
  roleLabel: string | null;
  percent: number | null;
  amount: number | null;
  status: CommissionStatus;
};

export function CommissionSplitTable(props: { splits: SplitRow[] }) {
  if (props.splits.length === 0) {
    return <p className="text-sm text-slate-500">No commission splits defined.</p>;
  }
  return (
    <div className="overflow-x-auto rounded border border-white/10">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="bg-white/5 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">%</th>
            <th className="px-3 py-2">Amount</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {props.splits.map((s) => (
            <tr key={s.id} className="border-t border-white/5">
              <td className="px-3 py-2">{s.roleLabel ?? "—"}</td>
              <td className="px-3 py-2">{s.percent ?? "—"}</td>
              <td className="px-3 py-2">{s.amount ?? "—"}</td>
              <td className="px-3 py-2">{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
