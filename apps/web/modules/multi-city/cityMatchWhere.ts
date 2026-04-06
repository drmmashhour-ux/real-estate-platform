import type { Prisma } from "@prisma/client";

export function fsboCityMatchWhere(terms: string[]): Prisma.FsboListingWhereInput {
  const t = terms.map((x) => x.trim()).filter(Boolean);
  if (t.length === 0) return {};
  if (t.length === 1) return { city: { contains: t[0], mode: "insensitive" } };
  return { OR: t.map((term) => ({ city: { contains: term, mode: "insensitive" as const } })) };
}

export function bnhubCityMatchWhere(terms: string[]): Prisma.ShortTermListingWhereInput {
  const t = terms.map((x) => x.trim()).filter(Boolean);
  if (t.length === 0) return {};
  if (t.length === 1) return { city: { contains: t[0], mode: "insensitive" } };
  return { OR: t.map((term) => ({ city: { contains: term, mode: "insensitive" as const } })) };
}

export function leadCityMatchWhere(terms: string[]): Prisma.LeadWhereInput {
  const t = terms.map((x) => x.trim()).filter(Boolean);
  if (t.length === 0) return {};
  const cityClauses = t.flatMap((term) => [
    { fsboListing: { city: { contains: term, mode: "insensitive" as const } } },
    { bnhubStayForLead: { city: { contains: term, mode: "insensitive" as const } } },
    { purchaseRegion: { contains: term, mode: "insensitive" as const } },
  ]);
  return { OR: cityClauses };
}
