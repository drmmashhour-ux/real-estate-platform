import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { approveListing, ModerationError } from "@/lib/bnhub/verification";
import { blockIfDemoWrite } from "@/lib/demo-mode-api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = blockIfDemoWrite(request);
  if (blocked) return blocked;

  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdminSurface(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const createdBy = typeof body?.createdBy === "string" ? body.createdBy : userId;
    const listing = await approveListing(id, createdBy);
    return NextResponse.json(listing);
  } catch (e) {
    if (e instanceof ModerationError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    console.error("[moderation/approve]", e);
    return NextResponse.json({ error: "Failed to approve listing" }, { status: 500 });
  }
}
