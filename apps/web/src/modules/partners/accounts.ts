import { prisma } from "@/lib/db";

const db = prisma as unknown as {
  platformPartner: {
    create: (args: object) => Promise<unknown>;
    findUnique: (args: object) => Promise<unknown>;
    findMany: (args: object) => Promise<unknown[]>;
  };
};

export async function createPartner(input: { slug: string; name: string; contactEmail: string; revenueShareBps?: number }) {
  return db.platformPartner.create({
    data: {
      slug: input.slug.trim().toLowerCase(),
      name: input.name.trim(),
      contactEmail: input.contactEmail.trim(),
      revenueShareBps: input.revenueShareBps ?? 0,
    },
  });
}

export async function getPartnerBySlug(slug: string) {
  return db.platformPartner.findUnique({ where: { slug: slug.trim().toLowerCase() } });
}

export async function listActivePartners() {
  return db.platformPartner.findMany({ where: { active: true }, orderBy: { name: "asc" } });
}
