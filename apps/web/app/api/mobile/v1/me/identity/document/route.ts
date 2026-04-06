import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { saveVerificationImage } from "@/lib/verification/document-storage";
import { requireMobileUser } from "@/lib/mobile/mobileAuth";
import { resolvePrismaIdentitySubjectUserId } from "@/lib/mobile/resolvePrismaIdentitySubjectUserId";

export const dynamic = "force-dynamic";

/**
 * POST /api/mobile/v1/me/identity/document
 * Multipart: `file` — government ID image or PDF (stored server-side; review is manual until doc API is wired).
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireMobileUser(request);
    const prismaUserId = await resolvePrismaIdentitySubjectUserId(authUser);
    if (!prismaUserId) {
      return Response.json(
        { error: "Your account is not linked to a platform profile yet. Try signing out and back in." },
        { status: 409 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return Response.json({ error: "file is required" }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveVerificationImage({
      userId: prismaUserId,
      kind: "government_id",
      buffer,
      mimeType,
      originalFilename: file.name,
    });
    if (!saved.ok) {
      return Response.json({ error: saved.error }, { status: 400 });
    }

    await prisma.identityVerification.upsert({
      where: { userId: prismaUserId },
      create: {
        userId: prismaUserId,
        governmentIdFileUrl: saved.relativeUrl,
        verificationStatus: "PENDING",
      },
      update: {
        governmentIdFileUrl: saved.relativeUrl,
        verificationStatus: "PENDING",
        verifiedAt: null,
        verifiedById: null,
      },
    });

    return Response.json({
      ok: true,
      verificationStatus: "pending",
      message: "ID received. We will review it shortly.",
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return Response.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
