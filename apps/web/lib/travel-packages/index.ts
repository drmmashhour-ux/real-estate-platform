import { prisma } from "@/lib/db";

export async function getPackages() {
  return prisma.package.findMany({
    orderBy: { title: "asc" },
  });
}

export async function getPackageById(id: string) {
  return prisma.package.findUnique({
    where: { id },
  });
}

export async function createPackageBooking(data: {
  packageId: string;
  guestName?: string;
  startDate: Date;
  endDate: Date;
  numberOfPeople: number;
  totalPrice: number;
}) {
  return prisma.packageBooking.create({
    data: {
      packageId: data.packageId,
      guestName: data.guestName ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
      numberOfPeople: data.numberOfPeople,
      totalPrice: data.totalPrice,
    },
  });
}
