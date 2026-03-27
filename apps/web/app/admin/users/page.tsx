import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { normalizeAnyPublicListingCode } from "@/lib/listing-code-public";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; listing?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/users");
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/");

  const { q, listing: listingQ } = await searchParams;
  const qTrim = q?.trim() ?? "";
  const listingTrim = listingQ?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: qTrim
      ? {
          OR: [
            { email: { contains: qTrim, mode: "insensitive" } },
            { userCode: { contains: qTrim, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      userCode: true,
      investmentMvpAnalyzeCount: true,
      createdAt: true,
      _count: {
        select: { investmentDeals: true },
      },
    },
  });

  const listingCodeCanon = listingTrim ? normalizeAnyPublicListingCode(listingTrim) : null;
  const listingHits = listingCodeCanon
    ? await Promise.all([
        prisma.shortTermListing.findFirst({
          where: { listingCode: { equals: listingCodeCanon, mode: "insensitive" } },
          select: { id: true, listingCode: true, title: true, city: true },
        }),
        prisma.listing.findFirst({
          where: { listingCode: { equals: listingCodeCanon, mode: "insensitive" } },
          select: { id: true, listingCode: true, title: true },
        }),
        prisma.fsboListing.findFirst({
          where: { listingCode: { equals: listingCodeCanon, mode: "insensitive" } },
          select: { id: true, listingCode: true, title: true, city: true },
        }),
      ])
    : [null, null, null];

  const [stHit, crmHit, fsboHit] = listingHits;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-xl font-semibold">Users</h1>
        <p className="mt-2 text-sm text-slate-400">
          Search by email or user code (USR-XXXXXX). Listing code lookup finds BNHub, CRM, and FSBO rows.
        </p>

        <form className="mt-6 flex flex-wrap gap-3" action="/admin/users" method="get">
          <input
            name="q"
            defaultValue={qTrim}
            placeholder="Email or USR- code"
            className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-slate-950">
            Search users
          </button>
        </form>

        <form className="mt-4 flex flex-wrap gap-3" action="/admin/users" method="get">
          <input type="hidden" name="q" value={qTrim} />
          <input
            name="listing"
            defaultValue={listingTrim}
            placeholder="Listing code (LST- / LEC-)"
            className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200">
            Find listing
          </button>
        </form>

        {listingCodeCanon ? (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm">
            <p className="font-medium text-slate-200">Listing code {listingCodeCanon}</p>
            <ul className="mt-2 space-y-2 text-slate-400">
              {stHit ? (
                <li>
                  BNHub:{" "}
                  <Link className="text-amber-400 hover:underline" href={`/bnhub/${stHit.id}`}>
                    {stHit.title} · {stHit.city}
                  </Link>
                </li>
              ) : (
                <li>BNHub: —</li>
              )}
              {fsboHit ? (
                <li>
                  FSBO:{" "}
                  <Link className="text-amber-400 hover:underline" href={`/listings/${fsboHit.id}`}>
                    {fsboHit.title} · {fsboHit.city}
                  </Link>
                </li>
              ) : (
                <li>FSBO: —</li>
              )}
              {crmHit ? (
                <li>
                  CRM:{" "}
                  <Link className="text-amber-400 hover:underline" href={`/dashboard/listings/${crmHit.id}`}>
                    {crmHit.title} ({crmHit.listingCode})
                  </Link>
                </li>
              ) : (
                <li>CRM: —</li>
              )}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">User code</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Analyses</th>
                <th className="px-4 py-3 font-medium">Saved deals</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((row) => (
                <tr key={row.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{row.userCode ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-200">{row.email}</td>
                  <td className="px-4 py-3 text-slate-300">{row.investmentMvpAnalyzeCount}</td>
                  <td className="px-4 py-3 text-slate-300">{row._count.investmentDeals}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 ? <p className="mt-6 text-slate-500">No users found.</p> : null}
      </div>
    </main>
  );
}
