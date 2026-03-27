import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { normalizeDigits, validateBrokerTaxForm, TAX_DISCLAIMER } from "@/lib/tax/quebec-broker-tax";

export const dynamic = "force-dynamic";

async function requireBrokerUser() {
  const userId = await getGuestId();
  if (!userId) return { error: Response.json({ error: "Sign in required" }, { status: 401 }) };
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return { error: Response.json({ error: "Broker account required" }, { status: 403 }) };
  }
  return { userId: user.id };
}

/** GET — own tax registration (sensitive) */
export async function GET() {
  const r = await requireBrokerUser();
  if ("error" in r) return r.error;

  const reg = await prisma.brokerTaxRegistration.findUnique({
    where: { userId: r.userId },
  });

  if (!reg) {
    return Response.json({
      notSubmitted: true,
      disclaimer: TAX_DISCLAIMER,
    });
  }

  return Response.json({
    registration: reg,
    disclaimer: TAX_DISCLAIMER,
  });
}

type PutBody = {
  legalName: string;
  businessName?: string | null;
  businessNumberNine: string;
  gstNumber?: string | null;
  qstNumber?: string | null;
  businessAddress: string;
  province?: string;
};

/** PUT — create/update (format validation only; status → SUBMITTED for staff review) */
export async function PUT(request: NextRequest) {
  const r = await requireBrokerUser();
  if ("error" in r) return r.error;

  let body: PutBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const province = (body.province ?? "QC").toUpperCase().slice(0, 8);
  const businessNumberNine = normalizeDigits(body.businessNumberNine ?? "");
  const gstNumber = body.gstNumber?.trim() ? normalizeDigits(body.gstNumber) : null;
  const qstNumber = body.qstNumber?.trim() ? normalizeDigits(body.qstNumber) : null;

  const v = validateBrokerTaxForm({
    legalName: body.legalName ?? "",
    businessName: body.businessName,
    businessNumberNine,
    gstNumber,
    qstNumber,
    businessAddress: body.businessAddress ?? "",
    province,
  });
  if (!v.ok) {
    return Response.json({ error: "Validation failed", errors: v.errors }, { status: 400 });
  }

  const reg = await prisma.brokerTaxRegistration.upsert({
    where: { userId: r.userId },
    create: {
      userId: r.userId,
      legalName: body.legalName.trim(),
      businessName: body.businessName?.trim() || null,
      businessNumberNine,
      gstNumber,
      qstNumber,
      businessAddress: body.businessAddress.trim(),
      province,
      status: "PENDING_STAFF_REVIEW",
    },
    update: {
      legalName: body.legalName.trim(),
      businessName: body.businessName?.trim() || null,
      businessNumberNine,
      gstNumber,
      qstNumber,
      businessAddress: body.businessAddress.trim(),
      province,
      status: "PENDING_STAFF_REVIEW",
      reviewedAt: null,
      reviewedByUserId: null,
    },
  });

  return Response.json({ ok: true, registration: reg, disclaimer: TAX_DISCLAIMER });
}
