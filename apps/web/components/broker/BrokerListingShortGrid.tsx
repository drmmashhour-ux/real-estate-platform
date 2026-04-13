import Link from "next/link";
import { buildFsboPublicListingPath } from "@/lib/seo/public-urls";
import type { PublicListingCard } from "@/lib/broker/public-showcase-listings";

function formatCad(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function summarize(text: string, max = 220) {
  const t = stripTags(text);
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function displayCode(row: PublicListingCard): string {
  if (row.listingCode?.trim()) return row.listingCode.trim();
  return `LST-${row.id.slice(-6).toUpperCase()}`;
}

export function BrokerListingShortGrid({
  listings,
  heading = "Active listings",
  emptyMessage = "No public listings yet. When this professional publishes ACTIVE listings on LECIPM, they will appear here.",
}: {
  listings: PublicListingCard[];
  heading?: string;
  emptyMessage?: string;
}) {
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#121212] px-5 py-10 text-center">
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-center text-xl font-bold text-white sm:text-2xl">{heading}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-400">
        Short details below. Use the listing code or &quot;Open listing&quot; for the full property page — price, photos,
        and disclosures.
      </p>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((row) => {
          const href = buildFsboPublicListingPath({
            id: row.id,
            city: row.city,
            propertyType: row.propertyType,
          });
          const code = displayCode(row);
          const img = row.coverImage?.trim();
          return (
            <li
              key={row.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121212] transition hover:border-premium-gold/35"
            >
              <div className="relative aspect-[16/10] w-full bg-black/50">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote listing URLs (Supabase / uploads)
                  <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-600">No photo</div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 font-mono text-[11px] font-semibold text-premium-gold">
                  {code}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-lg font-semibold text-white">{formatCad(row.priceCents)}</p>
                <p className="mt-1 text-sm font-medium text-slate-200">
                  {row.city}
                  {row.propertyType ? (
                    <span className="text-slate-500"> · {row.propertyType.replace(/_/g, " ")}</span>
                  ) : null}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.address}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{summarize(row.description)}</p>
                <Link
                  href={href}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-premium-gold px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-premium-gold/90"
                >
                  Open listing · {code}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
