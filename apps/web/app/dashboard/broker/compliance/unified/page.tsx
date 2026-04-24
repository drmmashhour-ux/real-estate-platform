"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { runComplianceEngine } from "@/modules/compliance/core/engine";
import type { ComplianceCaseContext } from "@/modules/compliance/core/rule-types";
import { ComplianceAlertBanner } from "@/modules/compliance/ui/ComplianceAlertBanner";
import { ComplianceChecklistCard } from "@/modules/compliance/ui/ComplianceChecklistCard";
import { ComplianceDecisionPanel } from "@/modules/compliance/ui/ComplianceDecisionPanel";
import { ComplianceTimeline } from "@/modules/compliance/ui/ComplianceTimeline";
import { FinancialRecordPanel } from "@/modules/compliance/ui/FinancialRecordPanel";
import { RequiredFormsPanel } from "@/modules/compliance/ui/RequiredFormsPanel";
import { TrustAccountPanel } from "@/modules/compliance/ui/TrustAccountPanel";
import type { FinancialComplianceRecord } from "@/modules/compliance/services/compliance-financial-record.service";

const SCENARIOS: Record<string, { label: string; ctx: ComplianceCaseContext; sampleRecord?: FinancialComplianceRecord | null }> = {
  trust_cash: {
    label: "Trust deposit — cash (receipt pending)",
    ctx: {
      caseId: "demo-trust-cash",
      dealId: "deal-1",
      transactionType: "deposit",
      paymentMethod: "cash",
      amount: 5000,
      currency: "CAD",
      contractId: "ctr-1",
      trustAccountId: "trust-1",
      payer: { fullName: "Marie Tremblay", identityVerified: true },
      beneficiary: { fullName: "Seller escrow" },
      documents: {},
      financialRecord: { created: true, receiptGenerated: false },
      metadata: {
        trustAccountMetadataComplete: true,
        recordsPolicyApplicable: true,
        recordMediumDefined: true,
        recordAccessControlled: true,
        retentionPeriodDefined: true,
        destructionPolicyDefined: true,
      },
    },
    sampleRecord: {
      recordId: "fin-demo-1",
      dealId: "deal-1",
      contractId: "ctr-1",
      category: "deposit",
      amount: 5000,
      currency: "CAD",
      payerName: "Marie Tremblay",
      beneficiaryName: "Seller escrow",
      paymentMethod: "cash",
      trustAccountRelated: true,
      supportingDocumentIds: [],
      createdAt: new Date().toISOString(),
    },
  },
  advertising_block: {
    label: "Advertising — no signed mandate",
    ctx: {
      caseId: "demo-adv",
      transactionType: "advertising",
      advertising: {
        active: true,
        signedBrokerageContractPresent: false,
        containsRequiredStatements: false,
        containsMisleadingClaims: false,
        mentionsSoldPrice: false,
        mentionsGuarantee: false,
        holdsValidLicense: true,
      },
    },
  },
  aml_review: {
    label: "AML — elevated score",
    ctx: {
      caseId: "demo-aml",
      transactionType: "purchase",
      identityVerification: { required: true, completed: true },
      aml: {
        suspiciousIndicators: ["structuring", "nominee", "geography_mismatch"],
        highRisk: true,
        largeCashTransaction: true,
        reportingRequired: false,
        recordKeepingComplete: false,
        indicatorScore: 72,
      },
      metadata: { largeCashReviewCompleted: false },
    },
  },
  records_retention: {
    label: "Records — register update overdue",
    ctx: {
      caseId: "demo-rec",
      metadata: {
        recordsCheckRequired: true,
        recordsRegistersUpToDate: false,
        recordsPolicyApplicable: true,
        recordMediumDefined: true,
        recordAccessControlled: true,
        retentionPeriodDefined: true,
        destructionPolicyDefined: true,
        destructionEligible: true,
        destructionSecureProcessConfirmed: false,
      },
    },
  },
  tax_invoice: {
    label: "Tax — commission missing invoice",
    ctx: {
      caseId: "demo-tax",
      transactionType: "commission",
      metadata: {
        taxableBrokerageService: true,
        gstRegistrationNumber: "000000000RT0001",
        qstRegistrationNumber: "0000000000TQ0001",
      },
      financialRecord: {
        created: true,
        invoiceGenerated: false,
        gstAmount: 250,
        qstAmount: 498.75,
        total: 6748.75,
      },
      documents: {},
    },
  },
};

export default function UnifiedComplianceDashboardPage() {
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>("trust_cash");

  const { ctx, sampleRecord } = SCENARIOS[scenario];
  const report = useMemo(() => runComplianceEngine(ctx), [scenario]);

  const failed = report.results.filter((r) => !r.passed);
  const amlFailed = failed.filter((r) => r.category === "aml").length;
  const trustFailed = failed.filter((r) => r.category === "trust").length;
  const recordsFailed = failed.filter((r) => r.category === "records").length;
  const taxFailed = failed.filter((r) => r.category === "tax").length;

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">LECIPM</p>
          <h1 className="text-2xl font-bold text-[#D4AF37]">Unified OACIQ compliance engine</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Deterministic rule packs (selection, representation, AML, trust, records, tax). Outcomes are advisory and
            blocking at the engine layer; final decisions stay with the licensed broker or compliance delegate.
          </p>
        </div>
        <Link href="/dashboard/broker/compliance" className="text-sm text-[#D4AF37] hover:underline">
          ← Compliance hub
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-400">
          Scenario:{" "}
          <select
            className="ml-2 rounded-lg border border-white/20 bg-black px-3 py-2 text-white"
            value={scenario}
            onChange={(e) => setScenario(e.target.value as keyof typeof SCENARIOS)}
          >
            {Object.entries(SCENARIOS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-gray-500">Client-side evaluation (no audit write on this demo page).</span>
      </div>

      <ComplianceAlertBanner decision={report.decision} />

      <div className="grid gap-4 lg:grid-cols-4">
        <SummaryStat label="Overall" value={report.decision.status} warn={report.decision.status !== "compliant"} />
        <SummaryStat label="AML issues" value={String(amlFailed)} warn={amlFailed > 0} />
        <SummaryStat label="Trust issues" value={String(trustFailed)} warn={trustFailed > 0} />
        <SummaryStat label="Records / tax" value={`${recordsFailed} / ${taxFailed}`} warn={recordsFailed + taxFailed > 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ComplianceDecisionPanel decision={report.decision} />
        <TrustAccountPanel
          trustAccountId={ctx.trustAccountId}
          payer={ctx.payer?.fullName}
          beneficiary={ctx.beneficiary?.fullName}
          contractLinked={Boolean(ctx.contractId)}
          cashReceiptId={ctx.documents?.cashReceiptFormId}
        />
        <RequiredFormsPanel
          cashReceiptRequired={ctx.paymentMethod === "cash"}
          cashReceiptId={ctx.documents?.cashReceiptFormId}
          invoiceId={ctx.documents?.invoiceId}
          auditPackId={ctx.documents?.auditPackId}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FinancialRecordPanel record={sampleRecord ?? null} />
        <ComplianceTimeline
          items={[
            { id: "1", at: report.evaluatedAt, label: "Engine evaluation", detail: `${report.results.length} rules applied` },
            {
              id: "2",
              at: report.evaluatedAt,
              label: "Blocking rules",
              detail:
                report.decision.blockingFailures.length === 0
                  ? "None"
                  : report.decision.blockingFailures.map((b) => b.ruleId).join(", "),
            },
          ]}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#D4AF37]">Checks by category</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(
            [
              "licence",
              "selection",
              "representation",
              "advertising",
              "verification",
              "aml",
              "records",
              "trust",
              "tax",
              "supervision",
            ] as const
          ).map((cat) => (
            <ComplianceChecklistCard key={cat} title={cat} results={report.byCategory[cat]} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryStat(props: { label: string; value: string; warn: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        props.warn ? "border-amber-600/50 bg-amber-950/20" : "border-emerald-900/40 bg-emerald-950/10"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-gray-500">{props.label}</div>
      <div className="mt-1 font-mono text-lg">{props.value}</div>
    </div>
  );
}
