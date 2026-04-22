/** Catalogue of amenities / clinical-adjacent services advertised by a residence. */
import { prisma } from "@/lib/db";

export async function syncResidenceServices(
  residenceId: string,
  services: Array<{ name: string; category: string }>
): Promise<number> {
  await prisma.seniorResidenceService.deleteMany({ where: { residenceId } });
  if (services.length === 0) return 0;

  await prisma.seniorResidenceService.createMany({
    data: services.map((s) => ({
      residenceId,
      name: s.name.slice(0, 256),
      category: s.category.slice(0, 40),
    })),
  });
  return services.length;
}

export async function listServices(residenceId: string) {
  return prisma.seniorResidenceService.findMany({
    where: { residenceId },
    orderBy: { category: "asc" },
  });
}
