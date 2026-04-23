import Link from "next/link";
import { LeadContactOrigin } from "@prisma/client";
import { prisma } from "@repo/db";

export async function ImmoContactControlSections() {
  const [dealsWithLead, commissionRows] = await Promise.all([
    prisma.deal.findMany({
      where: { lead: { contactOrigin: LeadContactOrigin.IMMO_CONTACT } },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        status: true,
        createdAt: true,
        listingCode: true,
        commissionEligible: true,
        lead: { select: { id: true, email: true, name: true, fsboListingId: true } },
        buyer: { select: { email: true } },
        seller: { select: { email: true } },
      },
    }),
    prisma.platformCommissionRecord.findMany({
      where: {
        OR: [
          { commissionSource: "IMMO_CONTACT" },
          { lead: { is: { contactOrigin: LeadContactOrigin.IMMO_CONTACT } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        createdAt: true,
        commissionAmountCents: true,
        platformShareCents: true,
        partnerShareCents: true,
        commissionEligible: true,
        commissionSource: true,
        dealId: true,
        leadId: true,
        lead: { select: { email: true, name: true } },
      },
    }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-premium-gold">Linked deals (ImmoContact leads)</h2>
        <p className="mt-1 text-xs text-slate-500">CRM leads with origin ImmoContact tied to a deal.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-slate-500">
              <tr>
                <th className="py-2 pr-2">Created</th>
                <th className="py-2 pr-2">Deal</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Lead</th>
              </tr>
            </thead>
            <tbody>
              {dealsWithLead.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-slate-500">
                    No deals linked to ImmoContact leads yet.
                  </td>
                </tr>
              ) : (
                dealsWithLead.map((d) => (
                  <tr key={d.id} className="border-t border-slate-800/80">
                    <td className="py-2 pr-2 whitespace-nowrap">{d.createdAt.toISOString().slice(0, 10)}</td>
                    <td className="py-2 pr-2 font-mono text-[10px]">
                      <Link href={`/admin/deals`} className="text-amber-400 hover:underline">
                        {d.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="py-2 pr-2">{d.status}</td>
                    <td className="py-2 pr-2 max-w-[160px] truncate" title={d.lead?.email ?? ""}>
                      {d.lead?.email ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-premium-gold">Commission records (ImmoContact-attributed)</h2>
        <p className="mt-1 text-xs text-slate-500">Platform commission rows tied to ImmoContact source or lead.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-slate-500">
              <tr>
                <th className="py-2 pr-2">When</th>
                <th className="py-2 pr-2">Source</th>
                <th className="py-2 pr-2">Amount</th>
                <th className="py-2 pr-2">Eligible</th>
              </tr>
            </thead>
            <tbody>
              {commissionRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-slate-500">
                    No commission rows for ImmoContact.
                  </td>
                </tr>
              ) : (
                commissionRows.map((c) => (
                  <tr key={c.id} className="border-t border-slate-800/80">
                    <td className="py-2 pr-2 whitespace-nowrap">{c.createdAt.toISOString().slice(0, 10)}</td>
                    <td className="py-2 pr-2 font-mono text-[10px]">{c.commissionSource ?? "—"}</td>
                    <td className="py-2 pr-2">
                      {c.commissionAmountCents != null
                        ? `$${(c.commissionAmountCents / 100).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="py-2 pr-2">{c.commissionEligible ? "yes" : "no"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
