import { redirect } from "next/navigation";

import { InvestorAddLeadForm } from "@/components/admin/InvestorAddLeadForm";
import {
  LogInvestorReplyButton,
  SendInvestorMessageButton,
  InvestorStatusSelect,
} from "@/components/admin/InvestorOutreachActions";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { listInvestorLeadsForAdmin } from "@/lib/investor/outreachEngine";
import { INVESTOR_LEAD_STATUSES } from "@/lib/investor/investorLeadStatus";

export const dynamic = "force-dynamic";

const PIPELINE = INVESTOR_LEAD_STATUSES;

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminInvestorOutreachPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/admin`;

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(base);
  }

  const leads = await listInvestorLeadsForAdmin().catch(() => [] as Awaited<ReturnType<typeof listInvestorLeadsForAdmin>>);
  const byStatus = (s: string) => leads.filter((l) => l.status === s);

  return (
    <div className="min-h-screen space-y-10 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">BNHub · LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">Investor outreach</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Pipeline, drafted messages, and reply logging. “Send message” stores copy + marks contacted — it does not send
          email from the product (paste into your mail client or CRM).
        </p>
        <a href={base} className="mt-3 inline-block text-sm text-[#D4AF37] hover:underline">
          ← Admin home
        </a>
      </div>

      <InvestorAddLeadForm />

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Pipeline</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
          {PIPELINE.map((col) => (
            <div key={col} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{col}</p>
              <ul className="mt-2 space-y-2">
                {byStatus(col).map((l) => (
                  <li key={l.id} className="rounded-lg border border-zinc-800/80 bg-black/40 px-2 py-2 text-sm">
                    <p className="font-medium text-zinc-100">{l.name || "Unnamed"}</p>
                    <p className="text-xs text-zinc-500">{l.email || "—"}</p>
                    <div className="mt-1">
                      <InvestorStatusSelect leadId={l.id} value={l.status} />
                    </div>
                  </li>
                ))}
                {byStatus(col).length === 0 ? <li className="text-xs text-zinc-600">No leads</li> : null}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800">
        <div className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">All leads</h2>
          <p className="mt-1 text-xs text-zinc-500">Last contact = latest outreach log timestamp.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last contact</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No investor leads yet. Add one above.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="border-b border-zinc-800/80 last:border-0">
                    <td className="px-4 py-3 text-zinc-200">{l.name || "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{l.email || "—"}</td>
                    <td className="px-4 py-3 align-top">
                      <InvestorStatusSelect leadId={l.id} value={l.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400 tabular-nums">
                      {fmtDate(l.lastContactAt)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-2">
                        <SendInvestorMessageButton leadId={l.id} />
                        <LogInvestorReplyButton leadId={l.id} />
                      </div>
                    </td>
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
