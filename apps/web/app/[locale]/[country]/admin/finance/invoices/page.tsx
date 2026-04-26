import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { FinanceHubTabs } from "@/components/admin/FinanceHubTabs";

export const dynamic = "force-dynamic";

type Sp = { status?: string; q?: string; hub?: string };

export default async function AdminFinanceInvoicesPage({ searchParams }: { searchParams?: Promise<Sp> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const sp = (await searchParams) ?? {};
  const q = sp.q?.trim();
  const statusFilter = sp.status?.trim();
  const hub = sp.hub?.trim();

  const rows = await prisma.platformInvoice.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { invoiceNumber: { contains: q, mode: "insensitive" } },
              { user: { email: { contains: q, mode: "insensitive" } } },
              { user: { userCode: { contains: q, mode: "insensitive" } } },
              { userId: { equals: q } },
              {
                payment: {
                  OR: [
                    { booking: { listing: { listingCode: { contains: q, mode: "insensitive" } } } },
                    { fsboListing: { listingCode: { contains: q, mode: "insensitive" } } },
                  ],
                },
              },
            ],
          }
        : {}),
      ...(statusFilter === "paid"
        ? { payment: { status: "paid" } }
        : statusFilter === "unpaid"
          ? { payment: { status: { not: "paid" } } }
          : {}),
      ...(hub
        ? {
            payment: { paymentType: hub },
          }
        : {}),
    },
    orderBy: { issuedAt: "desc" },
    take: 200,
    include: {
      user: { select: { email: true, userCode: true } },
      payment: {
        select: {
          status: true,
          paymentType: true,
          bookingId: true,
          dealId: true,
          fsboListingId: true,
          user: { select: { email: true } },
          booking: { select: { id: true, listing: { select: { listingCode: true } } } },
          fsboListing: { select: { listingCode: true } },
        },
      },
    },
  });

  return (
    <HubLayout title="Invoices" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <FinanceHubTabs />
      <div className="space-y-6">
        <div>
          <Link href="/admin/finance" className="text-sm text-amber-400 hover:text-amber-300">
            ← Finance overview
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">Platform invoices</h1>
          <p className="mt-1 text-sm text-slate-400">
            GST/QST amounts are frozen at issuance. Operational summaries only — not filed tax returns.
          </p>
        </div>

        <form className="flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="block text-xs text-slate-500">Search</label>
            <input
              name="q"
              className="input-premium mt-1 font-mono"
              placeholder="INV-, USR-, LST-, email, user id"
              defaultValue={sp.q ?? ""}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Payment status</label>
            <select name="status" className="input-premium mt-1" defaultValue={sp.status ?? ""}>
              <option value="">Any</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Not paid</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500">Payment type (hub proxy)</label>
            <input name="hub" className="input-premium mt-1" placeholder="e.g. booking" defaultValue={sp.hub ?? ""} />
          </div>
          <button type="submit" className="btn-primary">
            Filter
          </button>
        </form>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-slate-500">
              <tr>
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Issued</th>
                <th className="px-3 py-2">Party</th>
                <th className="px-3 py-2">Subtotal</th>
                <th className="px-3 py-2">GST</th>
                <th className="px-3 py-2">QST</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Pay</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">PDF</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 text-slate-300">
                  <td className="px-3 py-2 font-mono text-xs">{r.invoiceNumber}</td>
                  <td className="px-3 py-2 text-xs">{r.status}</td>
                  <td className="px-3 py-2 text-xs">{r.issuedAt.toISOString().slice(0, 10)}</td>
                  <td className="px-3 py-2 text-xs">
                    <div>{r.user?.email ?? "—"}</div>
                    {r.user?.userCode ? (
                      <div className="font-mono text-[10px] text-slate-500">{r.user.userCode}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{(r.subtotalCents ?? 0) / 100}</td>
                  <td className="px-3 py-2">{(r.gstCents ?? 0) / 100}</td>
                  <td className="px-3 py-2">{(r.qstCents ?? 0) / 100}</td>
                  <td className="px-3 py-2">{(r.totalCents ?? r.amountCents) / 100}</td>
                  <td className="px-3 py-2">{r.payment?.status ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.payment?.paymentType ?? "—"}</td>
                  <td className="px-3 py-2">
                    <a
                      href={`/api/invoices/${r.id}/download`}
                      className="text-amber-400 hover:text-amber-300"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <a
          href="/api/admin/finance/export?format=csv&type=tax_invoices"
          className="inline-block rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200"
        >
          Export full invoice CSV
        </a>
      </div>
    </HubLayout>
  );
}
