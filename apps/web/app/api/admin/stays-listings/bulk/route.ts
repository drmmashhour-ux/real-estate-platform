import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { approveListing, rejectListing } from "@/lib/bnhub/verification";

export const dynamic = "force-dynamic";

type BulkAction = "approve" | "reject" | "unlist" | "feature" | "unfeature";

/**
 * Admin bulk actions on BNHUB short-term listings.
 * Body: { ids: string[], action: BulkAction, reason?: string }
 */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdminSurface(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { ids?: unknown; action?: string; reason?: string };
  try {
    body = (await req.json()) as { ids?: unknown; action?: string; reason?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  const action = body.action as BulkAction;
  const reason = typeof body.reason === "string" ? body.reason : "Admin review";

  if (!ids.length) return Response.json({ error: "ids required" }, { status: 400 });
  if (!["approve", "reject", "unlist", "feature", "unfeature"].includes(action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  let ok = 0;
  const errors: string[] = [];

  for (const id of ids) {
    try {
      if (action === "approve") {
        await approveListing(id, userId);
      } else if (action === "reject") {
        await rejectListing(id, reason);
      } else if (action === "unlist") {
        await prisma.shortTermListing.update({
          where: { id },
          data: { listingStatus: "UNLISTED" },
        });
      } else if (action === "feature") {
        await prisma.shortTermListing.update({
          where: { id },
          data: { bnhubListingTopHostBadge: true },
        });
      } else if (action === "unfeature") {
        await prisma.shortTermListing.update({
          where: { id },
          data: { bnhubListingTopHostBadge: false },
        });
      }
      ok += 1;
    } catch (e) {
      errors.push(`${id}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  return Response.json({ updated: ok, errors });
}
