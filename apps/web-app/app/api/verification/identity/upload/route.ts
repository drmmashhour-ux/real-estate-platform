import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { saveVerificationImage } from "@/lib/verification/document-storage";
import { upsertIdentityVerification } from "@/lib/verification/identity";

type Kind = "government_id" | "selfie";

export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const formData = await request.formData();
    const kind = formData.get("kind") as string | null;
    const file = formData.get("file") as File | null;

    if (!kind || !["government_id", "selfie"].includes(kind)) {
      return Response.json({ error: "kind must be government_id or selfie" }, { status: 400 });
    }
    if (!file || file.size === 0) {
      return Response.json({ error: "File required" }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await saveVerificationImage({
      userId,
      kind: kind as Kind,
      buffer,
      mimeType,
      originalFilename: file.name,
    });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    const current = await upsertIdentityVerification({ userId });
    const updates: { governmentIdFileUrl?: string; selfiePhotoUrl?: string } = {};
    if (kind === "government_id") updates.governmentIdFileUrl = result.relativeUrl;
    if (kind === "selfie") updates.selfiePhotoUrl = result.relativeUrl;

    const updated = await upsertIdentityVerification({
      userId,
      governmentIdFileUrl: kind === "government_id" ? result.relativeUrl : current?.governmentIdFileUrl ?? undefined,
      selfiePhotoUrl: kind === "selfie" ? result.relativeUrl : current?.selfiePhotoUrl ?? undefined,
    });

    return Response.json({
      governmentIdFileUrl: updated.governmentIdFileUrl,
      selfiePhotoUrl: updated.selfiePhotoUrl,
      verificationStatus: updated.verificationStatus,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
