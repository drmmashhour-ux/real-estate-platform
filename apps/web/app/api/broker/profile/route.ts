import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { validateLicenseFormat } from "@/lib/broker/licenseValidation";
import { computeBrokerIsVerified, brokerHasLeadAccess } from "@/modules/mortgage/services/broker-verification";
import { getMortgageBrokerOwnerSession } from "@/modules/mortgage/services/mortgage-broker-owner-session";

export const dynamic = "force-dynamic";

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

/** POST — complete or update mortgage broker professional profile (sets pending review). */
export async function POST(request: NextRequest) {
  const session = await getMortgageBrokerOwnerSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = str(body.phone, 32);
  const company = str(body.company, 160);
  const licenseRaw = str(body.licenseNumber, 64);
  if (!phone || !licenseRaw || !company) {
    return NextResponse.json({ error: "Phone, company, and license number are required." }, { status: 400 });
  }

  const licenseFormat = validateLicenseFormat(licenseRaw);
  if (!licenseFormat.valid) {
    return NextResponse.json({ error: licenseFormat.reason }, { status: 400 });
  }
  const licenseNumber = licenseFormat.normalized;
  const specialties = str(body.specialties, 2000);
  const insuranceProvider = str(body.insuranceProvider, 160);
  const references = str(body.references, 8000);
  const fullName = str(body.fullName, 160);

  const yearsRaw = body.yearsExperience;
  let yearsExperience: number | null = null;
  if (typeof yearsRaw === "number" && Number.isFinite(yearsRaw)) {
    yearsExperience = Math.max(0, Math.min(80, Math.floor(yearsRaw)));
  } else if (typeof yearsRaw === "string" && yearsRaw.trim() !== "") {
    const n = Number(yearsRaw);
    if (Number.isFinite(n)) yearsExperience = Math.max(0, Math.min(80, Math.floor(n)));
  }

  const insuranceValid =
    body.insuranceValid === true || body.insuranceValid === "true" || body.insuranceValid === "on";

  const b = session.broker;
  const fresh = await prisma.mortgageBroker.findUnique({
    where: { id: b.id },
    select: {
      profileCompletedAt: true,
      idDocumentUrl: true,
      selfiePhotoUrl: true,
      identityStatus: true,
      verificationStatus: true,
    },
  });
  if (!fresh) {
    return NextResponse.json({ error: "Broker not found" }, { status: 404 });
  }

  const isFirstCompletion = !fresh.profileCompletedAt;
  if (isFirstCompletion) {
    if (!fresh.idDocumentUrl?.trim() || !fresh.selfiePhotoUrl?.trim()) {
      return NextResponse.json(
        {
          error:
            "Upload a government-issued ID and a selfie photo before submitting your profile.",
        },
        { status: 400 }
      );
    }
  }

  const alreadyApproved = brokerHasLeadAccess({
    verificationStatus: fresh.verificationStatus,
    identityStatus: fresh.identityStatus,
  });

  const displayName = fullName ?? b.fullName ?? b.name ?? b.email;

  await prisma.mortgageBroker.update({
    where: { id: b.id },
    data: {
      phone,
      company,
      licenseNumber,
      yearsExperience,
      specialties: specialties ?? null,
      insuranceProvider: insuranceProvider ?? null,
      insuranceValid,
      brokerReferences: references ?? null,
      fullName: displayName,
      name: displayName,
      profileCompletedAt: fresh.profileCompletedAt ?? new Date(),
      ...(alreadyApproved
        ? {}
        : {
            verificationStatus: "pending",
            isVerified: computeBrokerIsVerified({
              verificationStatus: "pending",
              identityStatus: fresh.identityStatus,
            }),
          }),
    },
  });

  return NextResponse.json({
    ok: true,
    verificationStatus: alreadyApproved ? "verified" : "pending",
    message: isFirstCompletion ? "Profile submitted for review." : "Profile updated.",
  });
}
