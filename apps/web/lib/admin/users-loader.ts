import { AccountStatus, PlatformRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AdminUserFilters = {
  search?: string;
  role?: PlatformRole;
  accountStatus?: AccountStatus;
  /** Email verified */
  verified?: "yes" | "no";
};

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: PlatformRole;
  accountStatus: AccountStatus;
  createdAt: Date;
  bookingCount: number;
  listingCount: number;
  emailVerified: boolean;
};

export async function getAdminUsers(filters: AdminUserFilters = {}, take = 200): Promise<AdminUserRow[]> {
  const where: Prisma.UserWhereInput = {};
  if (filters.role) where.role = filters.role;
  if (filters.accountStatus) where.accountStatus = filters.accountStatus;
  if (filters.verified === "yes") where.emailVerifiedAt = { not: null };
  if (filters.verified === "no") where.emailVerifiedAt = null;

  const q = filters.search?.trim();
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { userCode: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountStatus: true,
      createdAt: true,
      emailVerifiedAt: true,
      _count: {
        select: {
          bookingsAsGuest: true,
          shortTermListings: true,
        },
      },
    },
  });

  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    accountStatus: u.accountStatus,
    createdAt: u.createdAt,
    bookingCount: u._count.bookingsAsGuest,
    listingCount: u._count.shortTermListings,
    emailVerified: u.emailVerifiedAt != null,
  }));
}
