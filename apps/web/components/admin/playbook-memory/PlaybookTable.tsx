import Link from "next/link";

export type PlaybookRow = { id: string; name: string; key: string; status: string; domain: string; updatedAt: string };

export function PlaybookTable({ playbooks, basePath }: { playbooks: PlaybookRow[]; basePath: string }) {
  if (!playbooks.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 text-sm text-white/50">
        No playbooks in memory. Configure strategies or seed the memory engine first.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-amber-600/15">
      <table className="w-full min-w-[640px] text-left text-sm text-white/85">
        <thead className="bg-black/50 text-xs uppercase text-[#D4AF37]">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Key</th>
            <th className="p-2">Domain</th>
            <th className="p-2">Status</th>
            <th className="p-2">Updated</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {playbooks.map((p) => (
            <tr key={p.id} className="border-t border-white/5">
              <td className="p-2 font-medium text-white">{p.name}</td>
              <td className="p-2 font-mono text-xs text-white/60">{p.key}</td>
              <td className="p-2">{p.domain}</td>
              <td className="p-2">
                <span
                  className={
                    p.status === "ACTIVE"
                      ? "text-emerald-400/90"
                      : p.status === "PAUSED"
                        ? "text-amber-200/80"
                        : "text-white/50"
                  }
                >
                  {p.status}
                </span>
              </td>
              <td className="p-2 text-xs text-white/45">{p.updatedAt.slice(0, 19)}Z</td>
              <td className="p-2">
                <Link className="text-[#D4AF37] hover:underline" href={`${basePath}?p=${encodeURIComponent(p.id)}`}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
