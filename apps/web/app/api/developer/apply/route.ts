import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

/**
 * POST /api/developer/apply – Submit developer application (Projects hub).
 * Body: companyName, registrationNumber, email, phone, documentUrl, projectDetails.
 * Sets accountStatus = PENDING_VERIFICATION until admin approval.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
    const registrationNumber = typeof body.registrationNumber === "string" ? body.registrationNumber.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;
    const documentUrl = typeof body.documentUrl === "string" ? body.documentUrl.trim() : null;
    const projectDetails = typeof body.projectDetails === "string" ? body.projectDetails.trim() : null;

    if (!companyName || !registrationNumber || !email) {
      return Response.json(
        { error: "Company name, registration number, and email are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const existing = await prisma.developerApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (existing?.status === "pending") {
      return Response.json(
        { error: "You already have a pending developer application" },
        { status: 400 }
      );
    }

    const application = await prisma.developerApplication.create({
      data: {
        userId,
        companyName,
        registrationNumber,
        email: email || user.email,
        phone,
        documentUrl,
        projectDetails,
        status: "pending",
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { role: "DEVELOPER", accountStatus: "PENDING_VERIFICATION" },
    });

    return Response.json({
      applicationId: application.id,
      message: "Developer application submitted. An admin will review it.",
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Application failed" },
      { status: 500 }
    );
  }
}
