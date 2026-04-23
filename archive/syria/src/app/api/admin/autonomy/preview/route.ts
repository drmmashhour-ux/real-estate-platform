import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { buildAutonomyPreviewForProperty } from "@/lib/autonomy-recommendations";
import { getSyriaAutonomyMode } from "@/config/syria-platform.config";

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId")?.trim() ?? "";
  if (!propertyId) {
    return NextResponse.json({ ok: false, error: "missing_property_id" }, { status: 400 });
  }

  const property = await prisma.syriaProperty.findUnique({ where: { id: propertyId } });
  if (!property) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const preview = buildAutonomyPreviewForProperty(property);
  return NextResponse.json({
    ok: true,
    propertyId,
    autonomyMode: getSyriaAutonomyMode(),
    items: preview,
  });
}
