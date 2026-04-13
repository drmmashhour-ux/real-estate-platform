import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;
  return NextResponse.json(session.expert);
}

export async function PATCH(req: NextRequest) {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;
  const userId = session.userId;
  const expert = session.expert;

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : undefined;
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 32) : undefined;
  const company = typeof body.company === "string" ? body.company.trim().slice(0, 160) : undefined;
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 8000) : undefined;
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : undefined;
  const licenseNumber =
    typeof body.licenseNumber === "string" ? body.licenseNumber.trim().slice(0, 64) : undefined;
  const idDocumentType =
    typeof body.idDocumentType === "string" ? body.idDocumentType.trim().slice(0, 64) : undefined;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name || expert.name;
  if (phone !== undefined) data.phone = phone || null;
  if (company !== undefined) data.company = company || null;
  if (bio !== undefined) data.bio = bio || null;
  if (title !== undefined) data.title = title || null;
  if (licenseNumber !== undefined && expert.expertVerificationStatus !== "pending_review") {
    data.licenseNumber = licenseNumber ? licenseNumber : null;
  }
  if (idDocumentType !== undefined && expert.expertVerificationStatus !== "pending_review") {
    data.idDocumentType = idDocumentType || null;
  }

  const updated = await prisma.mortgageExpert.update({
    where: { id: expert.id },
    data,
  });

  if (phone !== undefined || name !== undefined) {
    await prisma.user
      .update({
        where: { id: userId },
        data: {
          ...(phone !== undefined ? { phone: phone || null } : {}),
          ...(name !== undefined ? { name: name || undefined } : {}),
        },
      })
      .catch(() => {});
  }

  return NextResponse.json(updated);
}
