import { prisma } from "@/lib/db";

export async function appendFormVersion(input: { formInstanceId: string; version: number; data: object }) {
  return prisma.lecipmFormVersion.create({
    data: {
      formInstanceId: input.formInstanceId,
      version: input.version,
      data: input.data as object,
    },
  });
}

export async function listVersions(formInstanceId: string) {
  return prisma.lecipmFormVersion.findMany({
    where: { formInstanceId },
    orderBy: { version: "desc" },
  });
}
