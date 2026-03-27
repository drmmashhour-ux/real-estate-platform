import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { saveVerificationImage } from "@/lib/verification/document-storage";
import { upsertIdentityVerification } from "@/lib/verification/identity";

/**
 * POST /api/identity-verification
 * Fields: user_id (optional, defaults to session), government_id_file (file), selfie_photo (file).
 * Uploads gov ID and/or selfie and creates/updates identity_verifications.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUserId = await getGuestId();
    if (!sessionUserId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const formData = await request.formData();
    const userIdParam = (formData.get("user_id") as string | null)?.trim();
    const userId = userIdParam && userIdParam === sessionUserId ? userIdParam : sessionUserId;
    if (userId !== sessionUserId) {
      return Response.json({ error: "Can only submit identity verification for yourself" }, { status: 403 });
    }

    const govFile = formData.get("government_id_file") as File | null;
    const selfieFile = formData.get("selfie_photo") as File | null;

    if (!govFile?.size && !selfieFile?.size) {
      return Response.json(
        { error: "At least one of government_id_file or selfie_photo required" },
        { status: 400 }
      );
    }

    let governmentIdFileUrl: string | null = null;
    let selfiePhotoUrl: string | null = null;

    if (govFile?.size) {
      const mimeType = govFile.type || "application/octet-stream";
      const buffer = Buffer.from(await govFile.arrayBuffer());
      const result = await saveVerificationImage({
        userId,
        kind: "government_id",
        buffer,
        mimeType,
        originalFilename: govFile.name,
      });
      if (!result.ok) {
        return Response.json({ error: result.error }, { status: 400 });
      }
      governmentIdFileUrl = result.relativeUrl;
    }

    if (selfieFile?.size) {
      const mimeType = selfieFile.type || "application/octet-stream";
      const buffer = Buffer.from(await selfieFile.arrayBuffer());
      const result = await saveVerificationImage({
        userId,
        kind: "selfie",
        buffer,
        mimeType,
        originalFilename: selfieFile.name,
      });
      if (!result.ok) {
        return Response.json({ error: result.error }, { status: 400 });
      }
      selfiePhotoUrl = result.relativeUrl;
    }

    const current = await upsertIdentityVerification({ userId });
    const updated = await upsertIdentityVerification({
      userId,
      governmentIdFileUrl: governmentIdFileUrl ?? current?.governmentIdFileUrl ?? undefined,
      selfiePhotoUrl: selfiePhotoUrl ?? current?.selfiePhotoUrl ?? undefined,
    });

    return Response.json({
      user_id: updated.userId,
      government_id_file: updated.governmentIdFileUrl,
      selfie_photo: updated.selfiePhotoUrl,
      verification_status: updated.verificationStatus.toLowerCase(),
      verified_at: updated.verifiedAt,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Identity verification failed" },
      { status: 500 }
    );
  }
}
