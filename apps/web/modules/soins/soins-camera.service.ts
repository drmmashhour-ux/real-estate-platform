import { prisma } from "@/lib/db";

/**
 * Returns the stored stream URL only after RBAC on the caller (caller must enforce).
 * Production: replace `streamUrl` with time-limited signed URL from your streaming vendor.
 */
export async function getAuthorizedStreamPayload(input: {
  residentId: string;
  streamId?: string;
}): Promise<{ streamUrl: string; isActive: boolean; streamId: string } | null> {
  const stream = await prisma.cameraStream.findFirst({
    where: {
      residentId: input.residentId,
      ...(input.streamId ? { id: input.streamId } : {}),
      isActive: true,
    },
    orderBy: { id: "asc" },
  });

  if (!stream) return null;

  return {
    streamId: stream.id,
    streamUrl: stream.streamUrl,
    isActive: stream.isActive,
  };
}

export async function listStreams(residentId: string) {
  return prisma.cameraStream.findMany({
    where: { residentId },
    select: { id: true, isActive: true },
  });
}
