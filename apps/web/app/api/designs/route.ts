import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  getDesigns,
  getStorageUsed,
  addDesign,
  DEFAULT_STORAGE_LIMIT_BYTES,
} from "@/lib/designs-store";
import { prisma } from "@/lib/db";
import { getUsage } from "@/lib/storage-quota";

export const dynamic = "force-dynamic";

function formatMb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

export async function GET() {
  try {
    const userId = await getGuestId();
    try {
      if (userId) {
        const [designs, usage] = await Promise.all([
          prisma.designAsset.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
          getUsage(userId),
        ]);
        return NextResponse.json({
          designs: designs.map((d) => ({
            id: d.id,
            title: d.title,
            imageUrl: d.imageUrl,
            listingId: d.listingId,
            createdAt: d.createdAt,
          })),
          storageUsed: formatMb(usage.usedBytes),
          storageLimit: formatMb(usage.limitBytes),
          usedBytes: usage.usedBytes,
          limitBytes: usage.limitBytes,
        });
      }
    } catch (dbError) {
      console.error("Designs GET DB error:", dbError);
    }
    const designs = getDesigns(userId ?? undefined);
    const usedBytes = getStorageUsed(userId ?? undefined);
    const limitBytes = DEFAULT_STORAGE_LIMIT_BYTES;
    return NextResponse.json({
      designs: designs.map((d) => ({
        id: d.id,
        title: d.title,
        imageUrl: d.imageUrl,
        listingId: d.listingId,
        createdAt: d.createdAt,
      })),
      storageUsed: formatMb(usedBytes),
      storageLimit: formatMb(limitBytes),
      usedBytes,
      limitBytes,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({
      designs: [],
      storageUsed: 0,
      storageLimit: formatMb(DEFAULT_STORAGE_LIMIT_BYTES),
      usedBytes: 0,
      limitBytes: DEFAULT_STORAGE_LIMIT_BYTES,
    });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getGuestId();
    const body = await req.json().catch(() => ({}));
    const design = addDesign({
      userId: userId ?? "anonymous",
      listingId: body.listingId ?? null,
      title: body.title ?? "Untitled Design",
      imageUrl: body.imageUrl ?? "",
    });
    return NextResponse.json({
      id: design.id,
      title: design.title,
      imageUrl: design.imageUrl,
      listingId: design.listingId,
      createdAt: design.createdAt,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save design" }, { status: 500 });
  }
}
