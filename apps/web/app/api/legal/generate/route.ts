import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { generateDocument } from "@/modules/legal/legal-assistant";
import { isLegalTemplateId, type LegalTemplateId } from "@/modules/legal/templates";

export const dynamic = "force-dynamic";

const partySchema = z.object({
  role: z.string().min(1),
  legalName: z.string().min(1),
  email: z.string().optional(),
  address: z.string().optional(),
});

const bodySchema = z.object({
  documentType: z.string().min(1),
  property: z
    .object({
      address: z.string().optional(),
      unit: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string().optional(),
      description: z.string().optional(),
      label: z.string().optional(),
    })
    .optional(),
  parties: z.array(partySchema).optional(),
  dates: z
    .object({
      effectiveDate: z.string().optional(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      leaseStart: z.string().optional(),
      leaseEnd: z.string().optional(),
      termEnd: z.string().optional(),
      policyEffective: z.string().optional(),
    })
    .optional(),
  terms: z
    .object({
      currency: z.string().optional(),
      totalAmount: z.string().optional(),
      depositAmount: z.string().optional(),
      rentAmount: z.string().optional(),
      securityDeposit: z.string().optional(),
      paymentDueDay: z.string().optional(),
      governingLawNote: z.string().optional(),
      brokerLicenseInfo: z.string().optional(),
      platformEntityName: z.string().optional(),
      scopeSummary: z.string().optional(),
      compensationSummary: z.string().optional(),
      refundRulesSummary: z.string().optional(),
      forceMajeureNote: z.string().optional(),
      cancellationStrictness: z.enum(["strict", "moderate", "flexible"]).optional(),
      liabilityIntentNote: z.string().optional(),
    })
    .optional(),
  clauses: z
    .object({
      includeCancellation: z.boolean().optional(),
      includePaymentTerms: z.boolean().optional(),
      includeLiability: z.boolean().optional(),
    })
    .optional(),
});

/**
 * POST /api/legal/generate — assemble editable draft documents from templates (not legal advice).
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const docType = parsed.data.documentType.trim();
  if (!isLegalTemplateId(docType)) {
    return NextResponse.json(
      { error: "invalid_document_type", allowed: ["booking_agreement", "rental_agreement", "broker_agreement", "cancellation_policy"] },
      { status: 400 }
    );
  }

  try {
    const result = generateDocument({
      documentType: docType as LegalTemplateId,
      property: parsed.data.property,
      parties: parsed.data.parties,
      dates: parsed.data.dates,
      terms: parsed.data.terms,
      clauses: parsed.data.clauses,
    });

    return NextResponse.json({
      success: true,
      notLegalAdvice: true,
      title: result.title,
      documentType: result.documentType,
      fullDocument: result.fullDocument,
      editableFormat: result.editableFormat,
      disclaimer: result.disclaimer,
      hasUnresolvedPlaceholders: result.hasUnresolvedPlaceholders,
      unresolvedPlaceholderKeys: result.unresolvedPlaceholderKeys,
    });
  } catch (e) {
    console.error("[legal/generate]", e);
    return NextResponse.json({ error: "generate_failed" }, { status: 500 });
  }
}
