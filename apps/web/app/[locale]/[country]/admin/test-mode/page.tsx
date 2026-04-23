import Link from "next/link";
import { isTestMode } from "@/lib/config/app-mode";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TEST_SUFFIX = "@test.com";

export default async function AdminTestModePage() {
  const testMode = isTestMode();

  const testUsers = await prisma.user.findMany({
    where: { email: { endsWith: TEST_SUFFIX, mode: "insensitive" } },
    select: { id: true, email: true, role: true },
    orderBy: { email: "asc" },
  });
  const ids = testUsers.map((u) => u.id);

  const [bookings, payments, unlocks, bnPayouts, orchPayouts] = await Promise.all([
    ids.length
      ? prisma.booking.findMany({
          where: { guestId: { in: ids } },
          orderBy: { createdAt: "desc" },
          take: 25,
          include: {
            guest: { select: { email: true } },
            listing: { select: { listingCode: true, city: true, title: true } },
          },
        })
      : [],
    ids.length
      ? prisma.platformPayment.findMany({
          where: { userId: { in: ids } },
          orderBy: { createdAt: "desc" },
          take: 25,
          include: { user: { select: { email: true } } },
        })
      : [],
    ids.length
      ? prisma.listingContactLeadPurchase.findMany({
          where: { buyerUserId: { in: ids } },
          orderBy: { createdAt: "desc" },
          take: 25,
          include: { buyer: { select: { email: true } } },
        })
      : [],
    ids.length
      ? prisma.bnhubHostPayoutRecord.findMany({
          where: { hostUserId: { in: ids } },
          orderBy: { createdAt: "desc" },
          take: 15,
          include: {
            booking: { select: { id: true, confirmationCode: true } },
            listing: { select: { listingCode: true } },
          },
        })
      : [],
    ids.length
      ? prisma.orchestratedPayout.findMany({
          where: { hostId: { in: ids } },
          orderBy: { createdAt: "desc" },
          take: 15,
        })
      : [],
  ]);

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#D4AF37]">Test mode — E2E snapshot</h1>
            <p className="mt-1 text-sm text-white/60">
              Rows for accounts ending in <code className="text-white/80">{TEST_SUFFIX}</code>. Use with{" "}
              <code className="text-white/80">NEXT_PUBLIC_APP_MODE=test</code> and Stripe test keys.
            </p>
          </div>
          <Link href="/admin" className="text-sm text-[#D4AF37] underline-offset-2 hover:underline">
            ← Admin home
          </Link>
        </div>

        {!testMode ? (
          <div className="mb-6 rounded border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            App test mode flag is off. Enable <code className="text-amber-50">NEXT_PUBLIC_APP_MODE=test</code> for the
            global test banner and stricter Stripe guards.
          </div>
        ) : (
          <div className="mb-6 rounded border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Test mode is active — payments should use Stripe test mode only.
          </div>
        )}

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-white">Test users</h2>
          <div className="overflow-x-auto rounded border border-white/10">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Id</th>
                </tr>
              </thead>
              <tbody>
                {testUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-white/50">
                      No @test.com users — run <code className="text-white/70">pnpm seed:test</code> in apps/web.
                    </td>
                  </tr>
                ) : (
                  testUsers.map((u) => (
                    <tr key={u.id} className="border-t border-white/10">
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2">{u.role}</td>
                      <td className="px-3 py-2 font-mono text-xs text-white/50">{u.id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-white">BNHUB bookings (test guests)</h2>
          <div className="overflow-x-auto rounded border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">Guest</th>
                  <th className="px-3 py-2 font-medium">Stay</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Total (¢)</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-white/50">
                      No bookings yet for test users.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="border-t border-white/10">
                      <td className="px-3 py-2 whitespace-nowrap text-white/80">{b.createdAt.toISOString().slice(0, 16)}</td>
                      <td className="px-3 py-2">{b.guest.email}</td>
                      <td className="px-3 py-2">
                        {b.listing.listingCode ?? b.listing.title ?? b.listingId}
                        <span className="block text-xs text-white/45">{b.listing.city}</span>
                      </td>
                      <td className="px-3 py-2">{b.status}</td>
                      <td className="px-3 py-2">{b.totalCents}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-white">Platform payments</h2>
          <div className="overflow-x-auto rounded border border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Amount (¢)</th>
                  <th className="px-3 py-2 font-medium">Session</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-white/50">
                      No platform payments for test users yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="border-t border-white/10">
                      <td className="px-3 py-2 whitespace-nowrap text-white/80">{p.createdAt.toISOString().slice(0, 16)}</td>
                      <td className="px-3 py-2">{p.user.email}</td>
                      <td className="px-3 py-2">{p.paymentType}</td>
                      <td className="px-3 py-2">{p.status}</td>
                      <td className="px-3 py-2">{p.amountCents}</td>
                      <td className="px-3 py-2 font-mono text-xs text-white/50">{p.stripeSessionId ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-white">Listing contact unlocks</h2>
          <div className="overflow-x-auto rounded border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">Buyer</th>
                  <th className="px-3 py-2 font-medium">Target</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Paid</th>
                </tr>
              </thead>
              <tbody>
                {unlocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-white/50">
                      No unlock purchases for test users yet.
                    </td>
                  </tr>
                ) : (
                  unlocks.map((u) => (
                    <tr key={u.id} className="border-t border-white/10">
                      <td className="px-3 py-2 whitespace-nowrap text-white/80">{u.createdAt.toISOString().slice(0, 16)}</td>
                      <td className="px-3 py-2">{u.buyer.email}</td>
                      <td className="px-3 py-2">
                        {u.targetKind} <span className="font-mono text-xs text-white/45">{u.targetListingId}</span>
                      </td>
                      <td className="px-3 py-2">{u.status}</td>
                      <td className="px-3 py-2">{u.paidAt ? u.paidAt.toISOString().slice(0, 16) : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-medium text-white">Payouts (simulated / BNHUB)</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="overflow-x-auto rounded border border-white/10">
              <h3 className="border-b border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80">BNHUB host payout records</h3>
              <table className="w-full text-left text-sm">
                <thead className="text-white/70">
                  <tr>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Net (¢)</th>
                  </tr>
                </thead>
                <tbody>
                  {bnPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-white/50">
                        None for test hosts.
                      </td>
                    </tr>
                  ) : (
                    bnPayouts.map((r) => (
                      <tr key={r.id} className="border-t border-white/10">
                        <td className="px-3 py-2 whitespace-nowrap text-white/80">{r.createdAt.toISOString().slice(0, 16)}</td>
                        <td className="px-3 py-2">{r.payoutStatus}</td>
                        <td className="px-3 py-2">{r.netAmountCents}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto rounded border border-white/10">
              <h3 className="border-b border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80">Orchestrated payouts</h3>
              <table className="w-full text-left text-sm">
                <thead className="text-white/70">
                  <tr>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Amount (¢)</th>
                  </tr>
                </thead>
                <tbody>
                  {orchPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-white/50">
                        None for test hosts.
                      </td>
                    </tr>
                  ) : (
                    orchPayouts.map((r) => (
                      <tr key={r.id} className="border-t border-white/10">
                        <td className="px-3 py-2 whitespace-nowrap text-white/80">{r.createdAt.toISOString().slice(0, 16)}</td>
                        <td className="px-3 py-2">{r.status}</td>
                        <td className="px-3 py-2">{r.amountCents}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
