import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";
import { PropertyCard } from "@/components/property/PropertyCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; min?: string; max?: string }>;
}) {
  const sp = await searchParams;
  const city = sp.city?.trim();
  const min = sp.min ? Number(sp.min) : undefined;
  const max = sp.max ? Number(sp.max) : undefined;

  const list = await prisma.property.findMany({
    where: {
      status: "ACTIVE",
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(min !== undefined || max !== undefined
        ? {
            price: {
              ...(min !== undefined ? { gte: min } : {}),
              ...(max !== undefined ? { lte: max } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-light text-white">Properties</h1>
        <p className="mt-2 text-sm text-emerald-200/60">
          Filters: add <code className="text-[#d4af37]">?city=&min=&max=</code> to the URL.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <PropertyCard
              key={p.id}
              id={p.id}
              title={p.title}
              city={p.city}
              price={`$${Number(p.price).toLocaleString()} CAD`}
              bedrooms={p.bedrooms}
              bathrooms={p.bathrooms}
            />
          ))}
        </div>
        {list.length === 0 && (
          <p className="mt-8 text-sm text-emerald-200/50">No listings match your filters.</p>
        )}
      </main>
      <Footer />
    </>
  );
}
