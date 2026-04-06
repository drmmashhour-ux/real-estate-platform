import { prisma } from "@/lib/db";
import { normalizeMobilePlatform, normalizePushProvider } from "@/lib/bnhub/mobile-api";

export async function upsertPushDeviceForUser(
  userId: string,
  body: Record<string, unknown>
): Promise<{
  id: string;
  token: string;
  platform: string;
  provider: string;
  deviceName: string | null;
  appVersion: string | null;
  lastSeenAt: Date;
}> {
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const platform = normalizeMobilePlatform(body?.platform);
  const provider = normalizePushProvider(body?.provider);
  const deviceName = typeof body?.deviceName === "string" ? body.deviceName.trim().slice(0, 120) : null;
  const appVersion = typeof body?.appVersion === "string" ? body.appVersion.trim().slice(0, 40) : null;

  if (!token || !platform) {
    const err = new Error("token and valid platform are required");
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  return prisma.mobileDeviceToken.upsert({
    where: { token },
    update: {
      userId,
      platform,
      provider,
      deviceName,
      appVersion,
      lastSeenAt: new Date(),
      revokedAt: null,
    },
    create: {
      userId,
      token,
      platform,
      provider,
      deviceName,
      appVersion,
      lastSeenAt: new Date(),
    },
    select: {
      id: true,
      token: true,
      platform: true,
      provider: true,
      deviceName: true,
      appVersion: true,
      lastSeenAt: true,
    },
  });
}
