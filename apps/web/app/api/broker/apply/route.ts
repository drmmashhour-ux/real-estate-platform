import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * POST /api/broker/apply – Submit broker certification application (OACIQ-style).
 * Body: fullName, email, phone, licenseNumber, authority, documentUrl
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
    const licenseNumber = typeof body.licenseNumber === "string" ? body.licenseNumber.trim() : "";
    const authority = typeof body.authority === "string" ? body.authority.trim() : "OACIQ";
    const documentUrl = typeof body.documentUrl === "string" ? body.documentUrl.trim() : null;

    if (!fullName || !email || !licenseNumber) {
      return Response.json(
        { error: "fullName, email, and licenseNumber are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const existing = await prisma.brokerApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (existing?.status === "pending") {
      return Response.json(
        { error: "You already have a pending application" },
        { status: 400 }
      );
    }

    const application = await prisma.brokerApplication.create({
      data: {
        userId,
        fullName: fullName || user.name || "",
        email: email || user.email,
        phone,
        licenseNumber,
        authority,
        documentUrl,
        status: "pending",
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { brokerStatus: "PENDING", accountStatus: "PENDING_VERIFICATION" },
    });

    return Response.json({
      applicationId: application.id,
      message: "Application submitted. An admin will review it.",
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Application failed" },
      { status: 500 }
    );
  }
}
