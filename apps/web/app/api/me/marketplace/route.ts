import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId, setUserRoleCookie } from "@/lib/auth/session";
import { isOnboardingMarketplacePersona } from "@/lib/marketplace/persona";
import { isSellerPlanId } from "@/lib/marketplace/seller-plan";
import { derivePlatformRoleFromPersona } from "@/lib/marketplace/platform-role";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      marketplacePersona: true,
      sellerPlan: true,
      role: true,
      name: true,
      phone: true,
      sellerProfileAddress: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const marketplacePersona =
    typeof body.marketplacePersona === "string" ? body.marketplacePersona : undefined;
  const sellerPlanRaw = body.sellerPlan;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : undefined;
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : undefined;
  const sellerProfileAddress =
    typeof body.sellerProfileAddress === "string" ? body.sellerProfileAddress.trim().slice(0, 2000) : undefined;

  if (marketplacePersona !== undefined && !isOnboardingMarketplacePersona(marketplacePersona)) {
    return NextResponse.json({ error: "Invalid marketplacePersona" }, { status: 400 });
  }

  let sellerPlan: string | null | undefined;
  if (sellerPlanRaw === null) sellerPlan = null;
  else if (typeof sellerPlanRaw === "string") {
    const s = sellerPlanRaw.trim().toLowerCase();
    if (!isSellerPlanId(s)) {
      return NextResponse.json({ error: "Invalid sellerPlan" }, { status: 400 });
    }
    sellerPlan = s;
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, marketplacePersona: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextRole =
    marketplacePersona !== undefined
      ? derivePlatformRoleFromPersona(marketplacePersona, existing.role) ?? existing.role
      : existing.role;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(marketplacePersona !== undefined && { marketplacePersona }),
      ...(marketplacePersona !== undefined && nextRole !== existing.role && { role: nextRole }),
      ...(sellerPlan !== undefined && { sellerPlan }),
      ...(name !== undefined && name.length > 0 && { name }),
      ...(phone !== undefined && phone.length > 0 && { phone }),
      ...(sellerProfileAddress !== undefined && sellerProfileAddress.length > 0 && { sellerProfileAddress }),
    },
    select: {
      marketplacePersona: true,
      sellerPlan: true,
      role: true,
      name: true,
      phone: true,
      sellerProfileAddress: true,
    },
  });

  const res = NextResponse.json(updated);
  const roleCk = setUserRoleCookie(updated.role);
  res.cookies.set(roleCk.name, roleCk.value, {
    path: roleCk.path,
    maxAge: roleCk.maxAge,
    httpOnly: roleCk.httpOnly,
    secure: roleCk.secure,
    sameSite: roleCk.sameSite,
  });
  return res;
}
