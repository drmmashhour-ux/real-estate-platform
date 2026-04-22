import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { logError } from "@/lib/logger";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createResidence, listResidences } from "@/modules/senior-living/residence.service";
import { syncResidenceServices } from "@/modules/senior-living/service.service";
import { upsertUnits } from "@/modules/senior-living/unit.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const rows = await listResidences({
      city: sp.get("city"),
      province: sp.get("province"),
      careLevel: sp.get("careLevel"),
      priceMin: sp.get("priceMin") ? Number(sp.get("priceMin")) : null,
      priceMax: sp.get("priceMax") ? Number(sp.get("priceMax")) : null,
      serviceCategory: sp.get("serviceCategory"),
      serviceNameContains: sp.get("serviceNameContains"),
      verifiedOnly: sp.get("verifiedOnly") === "1" || sp.get("verifiedOnly") === "true",
      take: sp.get("take") ? Number(sp.get("take")) : undefined,
    });
    return NextResponse.json({ residences: rows });
  } catch (e) {
    logError("[api.senior.residences.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.ADMIN && user.role !== PlatformRole.HOST && user.role !== PlatformRole.BROKER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name : "";
  const address = typeof body.address === "string" ? body.address : "";
  const city = typeof body.city === "string" ? body.city : "";
  const province = typeof body.province === "string" ? body.province : "";
  const careLevel = typeof body.careLevel === "string" ? body.careLevel : "";
  if (!name || !address || !city || !province || !careLevel) {
    return NextResponse.json({ error: "name, address, city, province, careLevel required" }, { status: 400 });
  }

  try {
    const residence = await createResidence({
      name,
      description: typeof body.description === "string" ? body.description : null,
      address,
      city,
      province,
      operatorId: user.role === PlatformRole.ADMIN && typeof body.operatorId === "string" ? body.operatorId : userId,
      careLevel,
      has24hStaff: body.has24hStaff === true,
      medicalSupport: body.medicalSupport === true,
      mealsIncluded: body.mealsIncluded === true,
      activitiesIncluded: body.activitiesIncluded === true,
      basePrice: typeof body.basePrice === "number" ? body.basePrice : null,
      priceRangeMin: typeof body.priceRangeMin === "number" ? body.priceRangeMin : null,
      priceRangeMax: typeof body.priceRangeMax === "number" ? body.priceRangeMax : null,
      latitude: typeof body.latitude === "number" ? body.latitude : null,
      longitude: typeof body.longitude === "number" ? body.longitude : null,
    });

    const units = Array.isArray(body.units) ? (body.units as { type: string; price?: number; available?: boolean }[]) : [];
    if (units.length) await upsertUnits(residence.id, units);

    const services = Array.isArray(body.services)
      ? (body.services as { name: string; category: string }[])
      : [];
    if (services.length) await syncResidenceServices(residence.id, services);

    return NextResponse.json({ residence });
  } catch (e) {
    logError("[api.senior.residences.post]", { error: e });
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
