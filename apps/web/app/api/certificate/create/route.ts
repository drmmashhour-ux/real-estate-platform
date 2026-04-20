import { NextRequest, NextResponse } from "next/server";

import { enforceProvisionalConditionCertificate } from "@/modules/certificates/lib/enforce-provisional-condition";
import { buildCertificateHTML } from "@/modules/certificates/pdf/certificate-builder";
import type { ImmovableCertificate } from "@/modules/certificates/types/immovable-certificate.types";

export async function POST(req: NextRequest) {
  const raw = (await req.json()) as ImmovableCertificate;
  const body = enforceProvisionalConditionCertificate(raw);

  console.log("[certificate:create]", body.id);

  /** Ensures PDF HTML pipeline runs server-side and emits [certificate:pdf] logs. */
  buildCertificateHTML(body);

  return NextResponse.json({
    success: true,
    certificate: body,
  });
}
