import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { resolveBrokerSession } from "@/lib/compliance/broker-session";
import {
  brokerProfessionalInsuranceEnforced,
  validateBrokerInsurance,
} from "@/lib/compliance/oaciq/broker-professional-insurance.service";
import { uploadBrokerInsurancePdf } from "@/lib/compliance/oaciq/broker-insurance-storage";
import { logInsuranceTagged } from "@/lib/server/launch-logger";
import { MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD } from "@/modules/compliance/insurance/insurance.types";

export const dynamic = "force-dynamic";

function parseDate(raw: unknown, label: string): { ok: true; value: Date } | { ok: false; error: string } {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, error: `${label} is required` };
  }
  const d = new Date(raw.trim());
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: `${label} is not a valid date` };
  }
  return { ok: true, value: d };
}

/** GET — validation summary + policy rows (no document URLs). */
export async function GET() {
  const userId = await getGuestId();
  const gate = await resolveBrokerSession(userId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const validation = await validateBrokerInsurance(gate.brokerId);
  const policies = await prisma.brokerInsurance.findMany({
    where: { brokerId: gate.brokerId },
    orderBy: { endDate: "desc" },
    select: {
      id: true,
      provider: true,
      policyNumber: true,
      startDate: true,
      endDate: true,
      status: true,
      coveragePerLoss: true,
      documentStorageKey: true,
    },
  });

  return NextResponse.json({
    enforcementEnabled: brokerProfessionalInsuranceEnforced(),
    ...validation,
    policies: policies.map(({ documentStorageKey, ...rest }) => ({
      ...rest,
      hasDocument: Boolean(documentStorageKey),
    })),
  });
}

/** POST — multipart: `file` (PDF), `coverageStart`, `coverageEnd`, optional `policyNumber`. */
export async function POST(req: Request) {
  const userId = await getGuestId();
  const gate = await resolveBrokerSession(userId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file (PDF) is required" }, { status: 400 });
  }

  const start = parseDate(form.get("coverageStart"), "coverageStart");
  if (!start.ok) return NextResponse.json({ error: start.error }, { status: 400 });
  const end = parseDate(form.get("coverageEnd"), "coverageEnd");
  if (!end.ok) return NextResponse.json({ error: end.error }, { status: 400 });
  if (end.value.getTime() < start.value.getTime()) {
    return NextResponse.json({ error: "coverageEnd must be on or after coverageStart" }, { status: 400 });
  }

  const policyNumberRaw = form.get("policyNumber");
  const policyNumber =
    typeof policyNumberRaw === "string" && policyNumberRaw.trim() ? policyNumberRaw.trim().slice(0, 128) : null;

  const buf = Buffer.from(await file.arrayBuffer());
  let storageKey: string;
  try {
    const up = await uploadBrokerInsurancePdf({
      brokerId: gate.brokerId,
      buffer: buf,
      contentType: file.type || "application/pdf",
    });
    storageKey = up.storageKey;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const now = new Date();
  const inTerm = start.value <= now && end.value >= now;
  const status = inTerm ? "ACTIVE" : "EXPIRED";

  const row = await prisma.brokerInsurance.create({
    data: {
      brokerId: gate.brokerId,
      provider: "FARCIQ",
      policyNumber,
      startDate: start.value,
      endDate: end.value,
      status,
      coveragePerLoss: Math.max(2_000_000, MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD),
      coveragePerYear: Math.max(2_000_000, MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD),
      deductibleLevel: 5_000,
      documentStorageKey: storageKey,
    },
  });

  logInsuranceTagged.info("uploaded", { brokerId: gate.brokerId, brokerInsuranceId: row.id });

  return NextResponse.json({
    ok: true,
    id: row.id,
    status: row.status,
    enforcementEnabled: brokerProfessionalInsuranceEnforced(),
  });
}
