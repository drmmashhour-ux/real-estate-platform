import Image from "next/image";
import Link from "next/link";

export type FeaturedPropertyCardProps = {
  id: string;
  title: string;
  city: string;
  priceLabel: string;
  beds: number;
  baths: number;
  sqft?: number | null;
  imageUrl: string;
  /** Use for curated mocks that are not real listing IDs. */
  detailHref?: string;
};

export function FeaturedPropertyCard({
  id,
  title,
  city,
  priceLabel,
  beds,
  baths,
  sqft,
  imageUrl,
  detailHref,
}: FeaturedPropertyCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111] shadow-[0_24px_80px_rgba(0,0,0,0.45)] transition hover:border-[#C9A646]/25">
      <div className="relative aspect-[4/3]">
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-lg text-white">{title}</h3>
        <p className="mt-1 text-sm text-[#CCCCCC]/80">{city}</p>
        <p className="mt-4 font-serif text-2xl text-[#C9A646]">{priceLabel}</p>
        <p className="mt-3 text-sm text-[#CCCCCC]/90">
          {beds} beds · {baths} baths
          {sqft != null ? ` · ${Math.round(sqft)} sqft` : ""}
        </p>
        <Link
          href={detailHref ?? `/properties/${id}`}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-[#C9A646]/40 py-2.5 text-sm font-medium text-[#C9A646] transition hover:bg-[#C9A646]/10"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}
