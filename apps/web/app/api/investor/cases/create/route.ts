import { NextResponse } from "next/server";
import { z } from "zod";
import { createInvestorAnalysisCase } from "@/lib/investor/service";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  title: z.string().min(1).max(500),
  city: z.string().max(200).optional(),
  propertyType: z.string().max(120).optional(),
  purchasePriceCents: z.number().int().positive().optional(),
  downPaymentCents: z.number().int().nonnegative().optional(),
  loanAmountCents: z.number().int().nonnegative().optional(),
  annualInterestRate: z.number().optional(),
  amortizationYears: z.number().int().positive().optional(),
  monthlyMortgageCents: z.number().int().nonnegative().optional(),
  monthlyRentCents: z.number().int().nonnegative().optional(),
  otherMonthlyIncomeCents: z.number().int().nonnegative().optional(),
  monthlyTaxesCents: z.number().int().nonnegative().optional(),
  monthlyInsuranceCents: z.number().int().nonnegative().optional(),
  monthlyUtilitiesCents: z.number().int().nonnegative().optional(),
  monthlyMaintenanceCents: z.number().int().nonnegative().optional(),
  monthlyManagementCents: z.number().int().nonnegative().optional(),
  monthlyVacancyCents: z.number().int().nonnegative().optional(),
  monthlyOtherExpensesCents: z.number().int().nonnegative().optional(),
  status: z.enum(["draft", "reviewed", "final"]).optional(),
});

export async function POST(req: Request) {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const b = parsed.data;
  const item = await createInvestorAnalysisCase({
    ownerType: ctx.owner.ownerType,
    ownerId: ctx.owner.ownerId,
    title: b.title,
    city: b.city,
    propertyType: b.propertyType,
    purchasePriceCents: b.purchasePriceCents,
    downPaymentCents: b.downPaymentCents,
    loanAmountCents: b.loanAmountCents,
    annualInterestRate: b.annualInterestRate,
    amortizationYears: b.amortizationYears,
    monthlyMortgageCents: b.monthlyMortgageCents,
    monthlyRentCents: b.monthlyRentCents,
    otherMonthlyIncomeCents: b.otherMonthlyIncomeCents,
    monthlyTaxesCents: b.monthlyTaxesCents,
    monthlyInsuranceCents: b.monthlyInsuranceCents,
    monthlyUtilitiesCents: b.monthlyUtilitiesCents,
    monthlyMaintenanceCents: b.monthlyMaintenanceCents,
    monthlyManagementCents: b.monthlyManagementCents,
    monthlyVacancyCents: b.monthlyVacancyCents,
    monthlyOtherExpensesCents: b.monthlyOtherExpensesCents,
    status: b.status ?? "draft",
    createdById: ctx.userId,
  });

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "INVESTOR_ANALYSIS_CASE_CREATED",
    payload: { caseId: item.id, title: item.title },
  });

  return NextResponse.json({ success: true, item });
}
