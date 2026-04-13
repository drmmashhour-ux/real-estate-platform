import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";

export const dynamic = "force-dynamic";

const ID_TYPES = new Set([
  "qc_drivers_license",
  "canadian_passport",
  "pr_card",
  "other_government_photo_id",
]);

/**
 * Submit professional profile for ops / compliance review (AMF licence + ID on file).
 */
export async function POST(req: NextRequest) {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;
  const { expert, userId } = session;

  if (expert.expertVerificationStatus === "verified") {
    return NextResponse.json({ error: "Already verified." }, { status: 400 });
  }
  if (expert.expertVerificationStatus === "pending_review") {
    return NextResponse.json({ error: "Application already submitted for review." }, { status: 400 });
  }
  // profile_incomplete | rejected — allow (re-)submission

  const body = (await req.json().catch(() => ({}))) as {
    name?: unknown;
    phone?: unknown;
    company?: unknown;
    title?: unknown;
    bio?: unknown;
    licenseNumber?: unknown;
    idDocumentType?: unknown;
    ampAttestation?: unknown;
  };

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 32) : "";
  const company = typeof body.company === "string" ? body.company.trim().slice(0, 160) : "";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 8000) : "";
  const licenseNumber = typeof body.licenseNumber === "string" ? body.licenseNumber.trim().slice(0, 64) : "";
  const idDocumentType = typeof body.idDocumentType === "string" ? body.idDocumentType.trim() : "";
  const ampAttestation = body.ampAttestation === true;

  if (!name || !phone || !licenseNumber) {
    return NextResponse.json(
      { error: "Full name, phone, and AMF mortgage broker licence number are required." },
      { status: 400 }
    );
  }
  if (!ID_TYPES.has(idDocumentType)) {
    return NextResponse.json({ error: "Select a valid ID document type." }, { status: 400 });
  }
  if (!ampAttestation) {
    return NextResponse.json(
      { error: "You must confirm that you hold an active AMF mortgage broker licence." },
      { status: 400 }
    );
  }

  const fresh = await prisma.mortgageExpert.findUnique({
    where: { id: expert.id },
    select: { photo: true, idDocumentPath: true },
  });
  if (!fresh?.photo) {
    return NextResponse.json({ error: "Upload a professional photo before submitting." }, { status: 400 });
  }
  if (!fresh.idDocumentPath) {
    return NextResponse.json({ error: "Upload a scan of your government-issued ID before submitting." }, { status: 400 });
  }

  const now = new Date();
  const updated = await prisma.mortgageExpert.update({
    where: { id: expert.id },
    data: {
      name,
      phone,
      company: company || null,
      title: title || "Mortgage broker",
      bio: bio || null,
      licenseNumber,
      idDocumentType,
      ampAttestedAt: now,
      expertVerificationStatus: "pending_review",
      profileSubmittedAt: now,
    },
  });

  await prisma.user
    .update({
      where: { id: userId },
      data: { name, phone },
    })
    .catch(() => {});

  return NextResponse.json({
    ok: true,
    expert: updated,
    message:
      "Application submitted. Our team will verify your AMF licence and ID. You will appear in the public directory after approval.",
  });
}
