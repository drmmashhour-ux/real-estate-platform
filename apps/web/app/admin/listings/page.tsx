import Link from "next/link";
import { ListingStatus } from "@prisma/client";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminListings } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

type Sp = Record<string, string | string[] | undefined>;

function pick(sp: Sp, key: string): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v.trim() || undefined;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || undefined;
  return undefined;
}

export default async function AdminListingsControlPage({ searchParams }: { searchParams: Promise<Sp> }) {
  await requireAdminControlUserId();
  const sp = await searchParams;
  const search = pick(sp, "q");
  const status = pick(sp, "status") as ListingStatus | undefined;
  const city = pick(sp, "city");
  const flagged = pick(sp, "flagged") === "1";
  const missingPhotos = pick(sp, "missingPhotos") === "1";

  const rows = await getAdminListings({
    search,
    status,
    city,
    flaggedOnly: flagged,
    missingPhotosOnly: missingPhotos,
  });

  return (
    <LecipmControlShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Listings</h1>
            <p className="mt-1 text-sm text-zinc-500">All BNHub short-term inventory — deep tools in Stays & moderation.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/listings/stays"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
              style={{ backgroundColor: GOLD }}
            >
              Stays table & actions
            </Link>
            <Link
              href="/admin/moderation"
              className="rounded-xl border border-zinc-700 bg-[#111] px-4 py-2.5 text-sm text-zinc-200"
            >
              Moderation
            </Link>
          </div>
        </div>

        <form className="grid gap-3 rounded-2xl border border-zinc-800 bg-[#111] p-4 md:grid-cols-2 lg:grid-cols-4" method="get">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search title, code, city, host…"
            className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white md:col-span-2"
          />
          <select name="status" defaultValue={status ?? ""} className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white">
            <option value="">All statuses</option>
            {Object.values(ListingStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input name="city" defaultValue={city} placeholder="City" className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white" />
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input type="checkbox" name="flagged" value="1" defaultChecked={flagged} />
            Flagged only
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input type="checkbox" name="missingPhotos" value="1" defaultChecked={missingPhotos} />
            Missing photos
          </label>
          <button type="submit" className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-white hover:bg-zinc-900">
            Apply
          </button>
        </form>

        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No listings match.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-black/50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Listing</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Host</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Views / Bkgs</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => (
                    <tr key={l.id} className="border-b border-zinc-800/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                            {l.coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={l.coverUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full items-center justify-center text-[10px] text-zinc-600">—</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{l.title.slice(0, 48)}</p>
                            <p className="font-mono text-xs text-zinc-500">{l.listingCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{l.city}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{l.hostEmail}</td>
                      <td className="px-4 py-3 text-xs text-zinc-300">{l.listingStatus}</td>
                      <td className="px-4 py-3" style={{ color: GOLD }}>
                        ${(l.nightPriceCents / 100).toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {l.views} / {l.bookingCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/bnhub/listings/${l.id}`} className="text-xs text-zinc-300 hover:underline">
                            View
                          </Link>
                          <Link href={`/bnhub/host/listings/${l.id}/edit`} className="text-xs text-zinc-300 hover:underline">
                            Edit
                          </Link>
                          <Link href={`/admin/listings/stays`} className="text-xs" style={{ color: GOLD }}>
                            Approve / pause
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </LecipmControlShell>
  );
}
