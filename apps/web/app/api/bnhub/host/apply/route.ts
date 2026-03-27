import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json(
        { error: "Sign in required to apply as host" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      propertyType,
      location,
      description,
    } = body as Record<string, string | undefined>;

    if (name?.trim()) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: name.trim() },
      });
    }

    const host = await prisma.bnhubHost.upsert({
      where: { userId },
      update: {
        status: "pending",
        name: name ?? undefined,
        email: email ?? undefined,
        phone: phone ?? undefined,
        propertyType: propertyType ?? undefined,
        location: location ?? undefined,
        description: description ?? undefined,
      },
      create: {
        userId,
        status: "pending",
        name: name ?? null,
        email: email ?? null,
        phone: phone ?? null,
        propertyType: propertyType ?? null,
        location: location ?? null,
        description: description ?? null,
      },
    });

    return Response.json(host, { status: 201 });
  } catch (e) {
    console.error("POST /api/bnhub/host/apply:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Apply failed" },
      { status: 400 }
    );
  }
}
