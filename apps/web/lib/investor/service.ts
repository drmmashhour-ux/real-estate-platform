import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  monthlyMortgagePayment,
  computeMonthlyOperatingIncome,
  computeMonthlyOperatingExpenses,
  computeMonthlyCashflow,
  computeAnnualCashflow,
  computeNOI,
  computeCapRate,
  computeGRM,
  computeCashOnCashReturn,
  computeROI,
  computeDSCR,
  computeBreakEvenOccupancy,
} from "@/lib/investor/calculations";
import { assertInvestmentInputsForCompute } from "@/lib/investor/safety";

export async function createInvestorAnalysisCase(data: Prisma.InvestorAnalysisCaseCreateInput) {
  return prisma.investorAnalysisCase.create({ data });
}

export async function getInvestorAnalysisCase(id: string) {
  return prisma.investorAnalysisCase.findUnique({
    where: { id },
    include: { scenarios: true },
  });
}

export async function listInvestorAnalysisCases(ownerType: string, ownerId: string) {
  return prisma.investorAnalysisCase.findMany({
    where: { ownerType, ownerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function computeInvestorAnalysis(caseId: string) {
  const row = await prisma.investorAnalysisCase.findUnique({
    where: { id: caseId },
  });

  if (!row) throw new Error("INVESTOR_CASE_NOT_FOUND");

  assertInvestmentInputsForCompute(row);

  const mortgage =
    row.monthlyMortgageCents != null && row.monthlyMortgageCents > 0 ?
      row.monthlyMortgageCents
    : monthlyMortgagePayment({
        principalCents: row.loanAmountCents ?? 0,
        annualInterestRate: row.annualInterestRate ?? 0,
        amortizationYears: row.amortizationYears ?? 25,
      });

  const monthlyIncomeCents = computeMonthlyOperatingIncome({
    monthlyRentCents: row.monthlyRentCents ?? 0,
    otherMonthlyIncomeCents: row.otherMonthlyIncomeCents ?? 0,
  });

  const monthlyExpensesCents = computeMonthlyOperatingExpenses({
    monthlyTaxesCents: row.monthlyTaxesCents ?? 0,
    monthlyInsuranceCents: row.monthlyInsuranceCents ?? 0,
    monthlyUtilitiesCents: row.monthlyUtilitiesCents ?? 0,
    monthlyMaintenanceCents: row.monthlyMaintenanceCents ?? 0,
    monthlyManagementCents: row.monthlyManagementCents ?? 0,
    monthlyVacancyCents: row.monthlyVacancyCents ?? 0,
    monthlyOtherExpensesCents: row.monthlyOtherExpensesCents ?? 0,
  });

  const monthlyCashflowCents = computeMonthlyCashflow({
    monthlyIncomeCents,
    monthlyExpensesCents,
    monthlyMortgageCents: mortgage,
  });

  const annualCashflowCents = computeAnnualCashflow(monthlyCashflowCents);
  const noiAnnualCents = computeNOI({
    monthlyIncomeCents,
    monthlyExpensesCents,
  });

  const annualDebtServiceCents = mortgage * 12;
  const annualGrossRentCents = (row.monthlyRentCents ?? 0) * 12;

  const capRate = computeCapRate({
    noiAnnualCents,
    purchasePriceCents: row.purchasePriceCents ?? 0,
  });

  const grossRentMultiplier = computeGRM({
    purchasePriceCents: row.purchasePriceCents ?? 0,
    annualGrossRentCents,
  });

  const cashInvestedCents = row.downPaymentCents ?? 0;

  const cashOnCashReturn = computeCashOnCashReturn({
    annualCashflowCents,
    cashInvestedCents,
  });

  const roiPercent = computeROI({
    annualCashflowCents,
    totalInvestedCents: cashInvestedCents,
  });

  const dscr = computeDSCR({
    noiAnnualCents,
    annualDebtServiceCents,
  });

  const breakEvenOccupancy = computeBreakEvenOccupancy({
    operatingExpensesAnnualCents: monthlyExpensesCents * 12,
    debtServiceAnnualCents: annualDebtServiceCents,
    grossPotentialRentAnnualCents: annualGrossRentCents,
  });

  return prisma.investorAnalysisCase.update({
    where: { id: caseId },
    data: {
      monthlyMortgageCents: mortgage,
      monthlyCashflowCents,
      annualCashflowCents,
      capRate,
      grossRentMultiplier,
      cashOnCashReturn,
      roiPercent,
      dscr,
      breakEvenOccupancy,
      status: "reviewed",
    },
  });
}
