import Link from "next/link";
import type { BrokerDealAssignment } from "@prisma/client";

type DealRow = {
  id: string;
  dealCode: string | null;
  status: string;
  crmStage: string | null;
  updatedAt: Date;
  brokerDealAssignments: BrokerDealAssignment[];
};

export function TeamDealBoard({ basePath, deals }: { basePath: string; deals: DealRow[] }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl text-ds-text">Deal ownership &amp; assignments</h2>
        <p className="mt-1 text-xs text-ds-text-secondary">
          Showing your active deals. Assign coordinators or reviewers from the deal workspace or POST{" "}
          <code className="text-ds-gold/80">/api/broker/assignments</code>.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-ds-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ds-border bg-black/40 text-xs uppercase tracking-wider text-ds-text-secondary">
            <tr>
              <th className="px-4 py-3">Deal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assignments</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id} className="border-b border-ds-border/60 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-ds-text">{d.dealCode ?? d.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-ds-text-secondary">
                  {d.status}
                  {d.crmStage ? <span className="ml-2 text-[10px]">· {d.crmStage}</span> : null}
                </td>
                <td className="px-4 py-3 text-xs text-ds-text-secondary">
                  {d.brokerDealAssignments.length === 0 ? "—" : `${d.brokerDealAssignments.length} active`}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`${basePath}/deals/${d.id}`} className="text-xs text-ds-gold hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
