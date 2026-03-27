/**
 * Notary records – list, create, assign to closing package.
 */

import { prisma } from "@/lib/db";

export async function listNotaries(params?: { jurisdiction?: string }) {
  return prisma.notary.findMany({
    where: params?.jurisdiction ? { jurisdiction: params.jurisdiction } : undefined,
    orderBy: { notaryName: "asc" },
  });
}

export async function getNotary(id: string) {
  return prisma.notary.findUnique({
    where: { id },
  });
}

export async function createNotary(params: {
  notaryName: string;
  notaryEmail: string;
  notaryOffice?: string | null;
  jurisdiction?: string | null;
}) {
  return prisma.notary.create({
    data: {
      notaryName: params.notaryName.trim(),
      notaryEmail: params.notaryEmail.trim(),
      notaryOffice: params.notaryOffice?.trim() ?? undefined,
      jurisdiction: params.jurisdiction?.trim() ?? undefined,
    },
  });
}

export async function assignNotaryToPackage(packageId: string, notaryId: string) {
  const [pkg, notary] = await Promise.all([
    prisma.closingPackage.findUnique({ where: { id: packageId } }),
    prisma.notary.findUnique({ where: { id: notaryId } }),
  ]);
  if (!pkg) throw new Error("Closing package not found");
  if (!notary) throw new Error("Notary not found");
  return prisma.closingPackage.update({
    where: { id: packageId },
    data: { notaryId },
    include: { notary: true },
  });
}

export async function updatePackageStatus(packageId: string, packageStatus: string) {
  return prisma.closingPackage.update({
    where: { id: packageId },
    data: { packageStatus },
  });
}
