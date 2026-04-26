import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

type Sp = { q?: string };

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<Sp> }) {
  await requireAdminControlUserId();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <LecipmControlShell>
        <p className="text-zinc-500">Enter a search query from the header bar.</p>
      </LecipmControlShell>
    );
  }

  const [users, listings, bookings] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { userCode: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 15,
      select: { id: true, email: true, name: true },
    }),
    prisma.shortTermListing.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { listingCode: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { id: { equals: query } },
        ],
      },
      take: 15,
      select: { id: true, title: true, listingCode: true, city: true },
    }),
    prisma.booking.findMany({
      where: {
        OR: [
          { id: { equals: query } },
          { confirmationCode: { contains: query, mode: "insensitive" } },
          { guestContactEmail: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 15,
      select: { id: true, confirmationCode: true, listing: { select: { title: true } } },
    }),
  ]);

  return (
    <LecipmControlShell>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-white">Search: {query}</h1>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Users</h2>
          {users.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600">No matches.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {users.map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/users?q=${encodeURIComponent(u.email)}`} className="text-zinc-300 hover:underline">
                    {u.name ?? u.email}
                  </Link>
                  <span className="ml-2 text-xs text-zinc-600">{u.email}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Listings</h2>
          {listings.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600">No matches.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {listings.map((l) => (
                <li key={l.id}>
                  <Link href={`/bnhub/listings/${l.id}`} className="text-zinc-300 hover:underline">
                    {l.title}
                  </Link>
                  <span className="ml-2 text-xs text-zinc-600">
                    {l.listingCode} · {l.city}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Bookings</h2>
          {bookings.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600">No matches.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {bookings.map((b) => (
                <li key={b.id}>
                  <Link href={`/bnhub/booking/${b.id}`} className="text-zinc-300 hover:underline">
                    {b.confirmationCode ?? b.id.slice(0, 10)}…
                  </Link>
                  <span className="ml-2 text-xs text-zinc-600">{b.listing.title}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </LecipmControlShell>
  );
}
