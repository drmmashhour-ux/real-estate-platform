import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * POST /api/host/apply – Submit host application (BNHub).
 * Body: fullName, email, phone, documentUrl.
 * Sets accountStatus = PENDING_VERIFICATION until admin approval.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;
    const documentUrl = typeof body.documentUrl === "string" ? body.documentUrl.trim() : null;

    if (!fullName || !email) {
      return Response.json(
        { error: "Full name and email are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const existing = await prisma.hostApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (existing?.status === "pending") {
      return Response.json(
        { error: "You already have a pending host application" },
        { status: 400 }
      );
    }

    const application = await prisma.hostApplication.create({
      data: {
        userId,
        fullName: fullName || user.name || "",
        email: email || user.email,
        phone,
        documentUrl,
        status: "pending",
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { role: "HOST", accountStatus: "PENDING_VERIFICATION" },
    });

    return Response.json({
      applicationId: application.id,
      message: "Host application submitted. An admin will review it.",
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Application failed" },
      { status: 500 }
    );
  }
}
