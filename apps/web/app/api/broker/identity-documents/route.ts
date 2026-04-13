import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { assessIdentityUploadAssist } from "@/lib/broker/identity-upload-assist";
import { computeBrokerIsVerified } from "@/modules/mortgage/services/broker-verification";
import { getMortgageBrokerOwnerSession } from "@/modules/mortgage/services/mortgage-broker-owner-session";
import { scanBufferBeforeStorage } from "@/lib/security/malware-scan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 5_000_000;
const ALLOWED = new Set(["image/jpeg", "image/png"]);

function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "jpg";
}

/** POST multipart: field `file`, form field `kind` = `id` | `selfie` */
export async function POST(req: Request) {
  const session = await getMortgageBrokerOwnerSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const kindRaw = form.get("kind");
  const kind = kindRaw === "id" || kindRaw === "selfie" ? kindRaw : null;
  if (!kind) {
    return NextResponse.json({ error: 'kind must be "id" or "selfie"' }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ error: "Only JPEG or PNG images allowed" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 5 MB)" }, { status: 400 });
  }

  const scan = await scanBufferBeforeStorage({
    bytes: buf,
    mimeType: mime,
    context: `mortgage_broker_identity_${kind}`,
  });
  if (!scan.ok) {
    return NextResponse.json({ error: scan.userMessage }, { status: scan.status ?? 422 });
  }

  const assist = await assessIdentityUploadAssist(buf, kind);

  const ext = extFromMime(mime);
  const fileName = `${randomUUID()}.${ext}`;
  const relative = `/uploads/brokers/${session.broker.id}/${fileName}`;
  const dir = path.join(process.cwd(), "public", "uploads", "brokers", session.broker.id);
  const fsPath = path.join(process.cwd(), "public", relative.replace(/^\//, ""));

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(fsPath, buf);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save file" }, { status: 500 });
  }

  const broker = await prisma.mortgageBroker.findUnique({
    where: { id: session.broker.id },
    select: { verificationStatus: true, identityStatus: true },
  });
  if (!broker) {
    return NextResponse.json({ error: "Broker not found" }, { status: 404 });
  }

  const resetIdentity = broker.identityStatus === "verified";
  const nextIdentityStatus = resetIdentity ? "pending" : broker.identityStatus;

  const updated = await prisma.mortgageBroker.update({
    where: { id: session.broker.id },
    data: {
      ...(kind === "id" ? { idDocumentUrl: relative } : { selfiePhotoUrl: relative }),
      ...(resetIdentity ? { identityStatus: "pending" } : {}),
      isVerified: computeBrokerIsVerified({
        verificationStatus: broker.verificationStatus,
        identityStatus: nextIdentityStatus,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    url: relative,
    kind,
    assist,
    idDocumentUrl: updated.idDocumentUrl,
    selfiePhotoUrl: updated.selfiePhotoUrl,
    assistDisclaimer: "Automated hints are not verification and do not approve your account.",
  });
}
