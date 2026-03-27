import Link from "next/link";

export type PropertyCardProps = {
  id: string;
  title: string;
  city: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
};

export function PropertyCard({ id, title, city, price, bedrooms, bathrooms }: PropertyCardProps) {
  return (
    <Link
      href={`/properties/${id}`}
      className="group block rounded-2xl border border-emerald-900/50 bg-[#0c1a14]/80 p-5 transition hover:border-[#d4af37]/40"
    >
      <h3 className="text-lg font-medium text-white group-hover:text-[#d4af37]">{title}</h3>
      <p className="mt-1 text-sm text-emerald-200/60">{city}</p>
      <p className="mt-3 text-xl font-semibold text-[#d4af37]">{price}</p>
      <p className="mt-2 text-xs text-emerald-200/50">
        {bedrooms} bd · {bathrooms} ba
      </p>
    </Link>
  );
}
