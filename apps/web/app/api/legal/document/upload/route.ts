import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { legalHubFlags } from "@/config/feature-flags";
import { requireUser } from "@/lib/auth/require-user";
import { uploadLegalDocument } from "@/modules/legal/legal-document.service";
import { LEGAL_HUB_ACTOR_TYPES } from "@/modules/legal/legal-hub-phase2.constants";

export const dynamic = "force-dynamic";

/**
 * POST multipart: `file`, `workflowType`, `requirementId`, `actorType`.
 * Uploads PDF/JPEG/PNG only; content sniffed server-side — not legal advice.
 */
export async function POST(req: Request) {
  if (!legalHubFlags.legalHubV1 || !legalHubFlags.legalUploadV1) {
    return NextResponse.json({ error: "Legal upload is disabled" }, { status: 403 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileEntry = form.get("file");
  const workflowType = String(form.get("workflowType") ?? "").trim();
  const requirementId = String(form.get("requirementId") ?? "").trim();
  const actorType = String(form.get("actorType") ?? "").trim();

  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!workflowType || !requirementId || !actorType) {
    return NextResponse.json({ error: "workflowType, requirementId, and actorType are required" }, { status: 400 });
  }
  if (!LEGAL_HUB_ACTOR_TYPES.has(actorType)) {
    return NextResponse.json({ error: "Invalid actor type" }, { status: 400 });
  }

  const declaredMime = fileEntry.type?.trim() || null;
  const rawName = typeof fileEntry.name === "string" ? fileEntry.name : null;

  let buffer: Buffer;
  try {
    const ab = await fileEntry.arrayBuffer();
    buffer = Buffer.from(ab);
  } catch {
    return NextResponse.json({ error: "Could not read file" }, { status: 400 });
  }

  const result = await uploadLegalDocument({
    userId: auth.user.id,
    actorType,
    workflowType,
    requirementId,
    buffer,
    declaredMime,
    originalFileName: rawName,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ document: result.document });
}
