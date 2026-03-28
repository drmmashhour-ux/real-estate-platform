import type { Prisma } from "@prisma/client";
import { expandCityKeyToDbNames } from "@/src/modules/cities/cityNormalizer";

export function shortTermCityWhere(
  cityKey: string,
  profileCityName?: string | null
): Prisma.ShortTermListingWhereInput {
  const names = expandCityKeyToDbNames(cityKey, profileCityName);
  if (names.length === 1) {
    return { city: { equals: names[0], mode: "insensitive" } };
  }
  return { OR: names.map((n) => ({ city: { equals: n, mode: "insensitive" as const } })) };
}

export function fsboCityWhere(
  cityKey: string,
  profileCityName?: string | null
): Prisma.FsboListingWhereInput {
  const names = expandCityKeyToDbNames(cityKey, profileCityName);
  if (names.length === 1) {
    return { city: { equals: names[0], mode: "insensitive" } };
  }
  return { OR: names.map((n) => ({ city: { equals: n, mode: "insensitive" as const } })) };
}
