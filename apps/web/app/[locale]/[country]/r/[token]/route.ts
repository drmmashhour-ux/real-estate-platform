import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

export const dynamic = "force-dynamic";

function resolveTarget(link: { resourceType: string; resourceKey: string }): string | null {
  if (link.resourceType === "listing_analysis") {
    const parts = link.resourceKey.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const listingId = parts[parts.length - 1]!;
      const city = parts[parts.length - 2]!;
      return `/analysis/${city}/${listingId}`;
    }
  }
  if (link.resourceType === "market") {
    return `/market/${link.resourceKey}`;
  }
  return null;
}

/**
 * Short redirect URL — increments click count then sends user to the destination.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const link = await prisma.publicShareLink.findUnique({ where: { token } });
  if (!link) {
    return NextResponse.redirect(new URL("/", getSiteBaseUrl()), 302);
  }

  await prisma.$transaction([
    prisma.publicShareLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    }),
    prisma.shareClickEvent.create({
      data: { shareLinkId: link.id },
    }),
  ]);

  const path = resolveTarget(link);
  const base = getSiteBaseUrl();
  const dest = path ? `${base}${path}` : base;
  return NextResponse.redirect(dest, 302);
}
