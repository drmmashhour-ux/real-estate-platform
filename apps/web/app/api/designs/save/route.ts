import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { addDesign } from "@/lib/designs-store";
import { prisma } from "@/lib/db";
import { getOrCreateUserStorage, addUsage } from "@/lib/storage-quota";

export const dynamic = "force-dynamic";

const DESIGN_ASSET_BYTES = 2 * 1024 * 1024; // 2 MB per saved design

/**
 * POST /api/designs/save
 * Body: { title?, imageUrl?, listingId? }
 * Saves design (DesignAsset in DB when available) and increases storage usage.
 */
export async function POST(req: Request) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const title = body.title ?? "Untitled Design";
    const imageUrl = body.imageUrl ?? "";
    const listingId = body.listingId ?? null;

    try {
      await getOrCreateUserStorage(userId);
      const design = await prisma.designAsset.create({
        data: { userId, listingId, title, imageUrl },
      });
      await addUsage(userId, DESIGN_ASSET_BYTES);
      return NextResponse.json({
        id: design.id,
        userId: design.userId,
        listingId: design.listingId,
        title: design.title,
        imageUrl: design.imageUrl,
        createdAt: design.createdAt,
      });
    } catch (dbError) {
      console.error("Design save DB error:", dbError);
      const design = addDesign({ userId, listingId, title, imageUrl });
      return NextResponse.json({
        id: design.id,
        userId: design.userId,
        listingId: design.listingId,
        title: design.title,
        imageUrl: design.imageUrl,
        createdAt: design.createdAt,
      });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to save design. Please try again." },
      { status: 500 }
    );
  }
}
