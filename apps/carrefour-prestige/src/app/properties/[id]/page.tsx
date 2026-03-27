import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: { images: true, owner: { include: { profile: true } } },
  });
  if (!property) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-light text-white">{property.title}</h1>
        <p className="mt-2 text-[#d4af37]">
          ${Number(property.price).toLocaleString()} CAD · {property.city}
        </p>
        <p className="mt-6 text-emerald-100/80">{property.description}</p>
        <p className="mt-4 text-sm text-emerald-200/50">
          {property.bedrooms} bd · {property.bathrooms} ba
          {property.areaSqm != null ? ` · ${property.areaSqm} m²` : ""}
        </p>
      </main>
      <Footer />
    </>
  );
}
