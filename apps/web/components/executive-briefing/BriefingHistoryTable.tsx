"use client";

type Row = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
};

export function BriefingHistoryTable({
  rows,
  basePath,
}: {
  rows: Row[];
  basePath: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm text-zinc-300">
        <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2">Période</th>
            <th className="px-3 py-2">Statut</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-zinc-800">
              <td className="px-3 py-2">
                {r.periodStart.slice(0, 10)} → {r.periodEnd.slice(0, 10)}
              </td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2 text-right">
                <a className="text-amber-200/90 hover:underline" href={`${basePath}/briefings/${r.id}`}>
                  Ouvrir
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
