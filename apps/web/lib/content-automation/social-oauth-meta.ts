import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { encryptTokens } from "./social-accounts";
import { fetchPagesWithInstagram, pickPrimaryInstagramPage } from "@/lib/integrations/meta/pages";

/**
 * Persist Instagram Business + Facebook Page tokens after Meta OAuth (official Graph only).
 */
export async function saveMetaOAuthConnections(args: {
  userId: string;
  userAccessToken: string;
  expiresAt: Date | null;
}): Promise<{ instagramLinked: boolean; facebookPages: number }> {
  const pages = await fetchPagesWithInstagram(args.userAccessToken);
  const primary = pickPrimaryInstagramPage(pages);
  const ig = primary?.instagram_business_account;

  const userEnc = encryptTokens({
    accessToken: args.userAccessToken,
    expiresAt: args.expiresAt,
  });

  let instagramLinked = false;
  if (ig?.id) {
    const igId = ig.id;
    const existing = await prisma.socialAccount.findFirst({
      where: { userId: args.userId, platform: "instagram", accountId: igId },
    });
    const data = {
      userId: args.userId,
      platform: "instagram",
      accountId: igId,
      accountName: ig.username ?? primary?.name ?? null,
      accessTokenEncrypted: userEnc.accessTokenEncrypted,
      refreshTokenEncrypted: userEnc.refreshTokenEncrypted,
      expiresAt: userEnc.expiresAt,
      metadataJson: {
        igUserId: igId,
        pageId: primary?.id,
        source: "meta_oauth",
      } as Prisma.InputJsonValue,
      lastSyncAt: new Date(),
    };
    if (existing) {
      await prisma.socialAccount.update({ where: { id: existing.id }, data });
    } else {
      await prisma.socialAccount.create({ data });
    }
    instagramLinked = true;
  }

  let facebookPages = 0;
  for (const page of pages) {
    if (!page.id || !page.access_token) continue;
    const enc = encryptTokens({ accessToken: page.access_token, expiresAt: null });
    const existing = await prisma.socialAccount.findFirst({
      where: { userId: args.userId, platform: "facebook", accountId: page.id },
    });
    const data = {
      userId: args.userId,
      platform: "facebook",
      accountId: page.id,
      accountName: page.name ?? null,
      accessTokenEncrypted: enc.accessTokenEncrypted,
      refreshTokenEncrypted: enc.refreshTokenEncrypted,
      expiresAt: enc.expiresAt,
      metadataJson: {
        source: "meta_oauth",
        hasInstagram: Boolean(page.instagram_business_account?.id),
      } as Prisma.InputJsonValue,
      lastSyncAt: new Date(),
    };
    if (existing) {
      await prisma.socialAccount.update({ where: { id: existing.id }, data });
    } else {
      await prisma.socialAccount.create({ data });
    }
    facebookPages += 1;
  }

  return { instagramLinked, facebookPages };
}
