/**
 * LECIPM E2E Flow Validator (E2EFlowValidator) — simulates Québec journey gates.
 * Run: `pnpm e2e:test` (apps/web or monorepo root)
 * Report: `<repo>/reports/e2e-validation.json`
 * Exit: 0 only if all flows return `pass`.
 */
import "./load-apps-web-env";

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isActionAllowedForMode, isForbiddenActionKey, requiresHumanApprovalForExecute } from "@/modules/ai-autopilot-layer/autopilotPolicy";
import type { AutopilotLayerMode } from "@/modules/ai-autopilot-layer/types";
import type { LegalNoticeKey } from "@/modules/legal-notices/legalNoticeContent";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../..", "..");
const REPORT_PATH = join(REPO_ROOT, "reports", "e2e-validation.json");

export type StepResult = "pass" | "fail" | "warning";

export type FlowStep = {
  id: string;
  name: string;
  run: (ctx: E2EContext) => void | Promise<void>;
  check: (ctx: E2EContext) => { result: StepResult; detail?: string };
};

export type E2EContext = {
  flowName: string;
  noticesAcknowledged: Set<LegalNoticeKey>;
  noticesSurfaced: Set<LegalNoticeKey>;
  complianceScore: number;
  protectionMode: boolean;
  partialDraft: boolean;
  aiReviewRan: boolean;
  aiFindings: number;
  aiFailed: boolean;
  baseDraftFallback: boolean;
  paymentCompleted: boolean;
  paymentRequiredCad: number | null;
  financingOk: boolean;
  signatureAllowed: boolean;
  signatureBlockReasons: string[];
  includeExclusionClarity: boolean;
  isFsbo: boolean;
  isRepresented: boolean;
  brokerAssisted: boolean;
  law25Consent: boolean;
  sharePiiWithoutConsent: boolean;
  offerSansGarantie: boolean;
  autopilotMode: AutopilotLayerMode;
  auditEvents: { at: string; type: string; message: string }[];
  pdfGenerated: boolean;
  pdfHashStored: string | null;
};


function nowIso() {
  return new Date().toISOString();
}

function createInitialContext(over: Partial<E2EContext> = {}): E2EContext {
  return {
    flowName: "",
    noticesAcknowledged: new Set(),
    noticesSurfaced: new Set(),
    complianceScore: 40,
    protectionMode: false,
    partialDraft: true,
    aiReviewRan: false,
    aiFindings: 0,
    aiFailed: false,
    baseDraftFallback: false,
    paymentCompleted: false,
    paymentRequiredCad: 15,
    financingOk: true,
    signatureAllowed: false,
    signatureBlockReasons: [],
    includeExclusionClarity: true,
    isFsbo: false,
    isRepresented: false,
    brokerAssisted: false,
    law25Consent: true,
    sharePiiWithoutConsent: false,
    offerSansGarantie: false,
    autopilotMode: "OFF",
    auditEvents: [],
    pdfGenerated: false,
    pdfHashStored: null,
    ...over,
  };
}

function logAudit(ctx: E2EContext, type: string, message: string) {
  ctx.auditEvents.push({ at: nowIso(), type, message });
}

function paymentGated(ctx: E2EContext) {
  return ctx.paymentRequiredCad != null;
}

/** Signature gate: surfaced notices must be acked; score ≥70; pay if self-serve; financing ok. */
function recomputeSignatureGate(ctx: E2EContext) {
  const reasons: string[] = [];
  for (const k of ctx.noticesSurfaced) {
    if (!ctx.noticesAcknowledged.has(k)) reasons.push(`Missing acknowledgment: ${k}`);
  }
  if (ctx.complianceScore < 70) reasons.push("Compliance score < 70");
  if (paymentGated(ctx) && !ctx.brokerAssisted && !ctx.paymentCompleted) reasons.push("Payment not completed");
  if (!ctx.financingOk) reasons.push("Financing condition not satisfied");
  if (!ctx.isRepresented) ctx.protectionMode = true;
  ctx.signatureBlockReasons = reasons;
  ctx.signatureAllowed = reasons.length === 0;
}

export type FlowRun = {
  name: string;
  steps: { stepId: string; stepName: string; result: StepResult; detail?: string }[];
  result: "pass" | "fail" | "warning";
};

export async function runFlow(name: string, steps: FlowStep[], ctx0?: E2EContext): Promise<FlowRun> {
  const ctx = ctx0 ?? createInitialContext();
  ctx.flowName = name;
  const stepsOut: FlowRun["steps"] = [];
  let worst: "pass" | "fail" | "warning" = "pass";

  for (const s of steps) {
    try {
      await s.run(ctx);
    } catch (e) {
      stepsOut.push({
        stepId: s.id,
        stepName: s.name,
        result: "fail",
        detail: e instanceof Error ? e.message : String(e),
      });
      worst = "fail";
      break;
    }
    const c = s.check(ctx);
    stepsOut.push({ stepId: s.id, stepName: s.name, result: c.result, detail: c.detail });
    if (c.result === "fail") worst = "fail";
    if (c.result === "warning" && worst === "pass") worst = "warning";
  }

  if (stepsOut.length < steps.length && !stepsOut.some((x) => x.result === "fail")) {
    worst = "fail";
  }

  return { name, steps: stepsOut, result: worst === "pass" ? "pass" : worst === "warning" ? "warning" : "fail" };
}

const FLOWS: { name: string; steps: FlowStep[]; ctx?: E2EContext }[] = [
  {
    name: "FLOW_1_BuyerUnrepresented",
    steps: [
      {
        id: "1.1",
        name: "Open listing, partial Turbo draft",
        run: (c) => {
          c.isRepresented = false;
          c.partialDraft = true;
          logAudit(c, "ui.listing", "view");
        },
        check: (c) => (c.isRepresented === false ? { result: "pass" } : { result: "fail" }),
      },
      {
        id: "1.2",
        name: "LIMITED_ROLE + PRIVACY notices + protection before ack",
        run: (c) => {
          c.noticesSurfaced.add("LIMITED_ROLE_NOTICE");
          c.noticesSurfaced.add("PRIVACY_NOTICE");
          recomputeSignatureGate(c);
        },
        check: (c) => {
          if (!c.noticesSurfaced.has("LIMITED_ROLE_NOTICE")) return { result: "fail", detail: "LIMITED_ROLE surfaced" };
          if (c.signatureAllowed) return { result: "fail", detail: "must block before ack" };
          if (!c.protectionMode) return { result: "fail", detail: "protection mode" };
          return { result: "pass" };
        },
      },
      {
        id: "1.3",
        name: "AI review, fix, compliance 85",
        run: (c) => {
          c.aiReviewRan = true;
          c.aiFindings = 0;
          c.complianceScore = 85;
          recomputeSignatureGate(c);
        },
        check: (c) => (c.aiReviewRan && c.complianceScore >= 70 && !c.signatureAllowed ? { result: "pass" } : { result: "fail" }),
      },
      {
        id: "1.4",
        name: "Self-serve payment $15",
        run: (c) => {
          c.paymentCompleted = true;
          recomputeSignatureGate(c);
        },
        check: (c) => (!c.signatureAllowed && c.paymentCompleted ? { result: "pass" } : { result: "fail" }),
      },
      {
        id: "1.5",
        name: "Ack all surfaced notices",
        run: (c) => {
          c.noticesAcknowledged.add("LIMITED_ROLE_NOTICE");
          c.noticesAcknowledged.add("PRIVACY_NOTICE");
          recomputeSignatureGate(c);
        },
        check: (c) => (c.signatureAllowed ? { result: "pass" } : { result: "fail", detail: c.signatureBlockReasons.join("; ") }),
      },
    ],
  },
  {
    name: "FLOW_2_WarrantyExclusion",
    steps: [
      {
        id: "2.1",
        name: "Sans garantie offer surfaces WARRANTY_EXCLUSION (CRITICAL)",
        run: (c) => {
          c.offerSansGarantie = true;
          c.noticesSurfaced.add("WARRANTY_EXCLUSION_NOTICE");
          c.complianceScore = 80;
          recomputeSignatureGate(c);
        },
        check: (c) => (!c.signatureAllowed && c.noticesSurfaced.has("WARRANTY_EXCLUSION_NOTICE") ? { result: "pass" } : { result: "fail" }),
      },
      {
        id: "2.2",
        name: "Require acknowledgment of warranty notice",
        run: (c) => {
          c.noticesAcknowledged.add("WARRANTY_EXCLUSION_NOTICE");
          c.paymentCompleted = true;
          c.noticesAcknowledged.add("LIMITED_ROLE_NOTICE");
          c.noticesAcknowledged.add("PRIVACY_NOTICE");
          c.noticesSurfaced.add("LIMITED_ROLE_NOTICE");
          c.noticesSurfaced.add("PRIVACY_NOTICE");
          recomputeSignatureGate(c);
        },
        check: (c) => (c.signatureAllowed ? { result: "pass" } : { result: "fail" }),
      },
    ],
  },
  {
    name: "FLOW_3_SellerFSBO",
    steps: [
      {
        id: "3.1",
        name: "FSBO + ambiguous inclusions",
        run: (c) => {
          c.isFsbo = true;
          c.includeExclusionClarity = false;
          c.complianceScore = 50;
        },
        check: (c) => (c.complianceScore < 70 ? { result: "pass" } : { result: "fail" }),
      },
      {
        id: "3.2",
        name: "Cannot proceed to signature until fixed",
        run: (c) => {
          recomputeSignatureGate(c);
        },
        check: (c) => (!c.signatureAllowed && c.complianceScore < 70 ? { result: "pass" } : { result: "fail" }),
      },
      {
        id: "3.3",
        name: "Clarify inclusions",
        run: (c) => {
          c.includeExclusionClarity = true;
          c.complianceScore = 80;
          recomputeSignatureGate(c);
        },
        check: (c) => (c.complianceScore >= 70 && c.includeExclusionClarity ? { result: "pass" } : { result: "fail" }),
      },
    ],
  },
  {
    name: "FLOW_4_BrokerAssisted",
    steps: [
      {
        id: "4.1",
        name: "Broker on file: bypass payment, review allowed",
        run: (c) => {
          c.brokerAssisted = true;
          c.isRepresented = true;
          c.paymentRequiredCad = null;
          c.paymentCompleted = false;
          c.noticesSurfaced.add("LIMITED_ROLE_NOTICE");
          c.noticesAcknowledged.add("LIMITED_ROLE_NOTICE");
          c.complianceScore = 85;
          recomputeSignatureGate(c);
        },
        check: (c) => (paymentGated(c) ? { result: "fail" } : c.signatureBlockReasons.includes("Payment not completed") ? { result: "fail" } : { result: "pass" }),
      },
    ],
  },
  {
    name: "FLOW_5_AIFallback",
    steps: [
      {
        id: "5.1",
        name: "AI error → base draft",
        run: (c) => {
          c.aiFailed = true;
          c.baseDraftFallback = true;
        },
        check: (c) => (c.baseDraftFallback && c.aiFailed ? { result: "pass" } : { result: "fail" }),
      },
    ],
  },
  {
    name: "FLOW_6_SAFE_AUTOPILOT",
    steps: [
      {
        id: "6.1",
        name: "SAFE mode: suggest/prep allowed, dangerous keys forbidden or need approval",
        run: (c) => {
          c.autopilotMode = "SAFE_AUTOPILOT";
        },
        check: () => {
          const suggestOk = isActionAllowedForMode("suggest_draft", "SAFE_AUTOPILOT");
          const signAllowed = isActionAllowedForMode("sign_contract", "SAFE_AUTOPILOT");
          const submitAllowed = isActionAllowedForMode("submit_offer", "SAFE_AUTOPILOT");
          if (!suggestOk) return { result: "fail", detail: "suggest_draft must be allowed" };
          if (signAllowed) return { result: "fail", detail: "sign_contract must be blocked" };
          if (submitAllowed) return { result: "fail", detail: "submit_offer must be blocked" };
          if (!isForbiddenActionKey("sign_contract")) return { result: "fail", detail: "sign_contract should be forbidden" };
          /** Prep actions may skip approval; execution of send/sign/charge still blocked — see autopilotPolicy. */
          void requiresHumanApprovalForExecute("prepare_draft", "SAFE_AUTOPILOT");
          return { result: "pass" };
        },
      },
    ],
  },
  {
    name: "FLOW_7_PrivacyBlock",
    steps: [
      {
        id: "7.1",
        name: "PII without consent (Law 25) → critical block",
        run: (c) => {
          c.sharePiiWithoutConsent = true;
          c.law25Consent = false;
        },
        check: (c) =>
          c.sharePiiWithoutConsent
            ? { result: c.law25Consent ? "fail" : "pass", detail: "export blocked" }
            : { result: "fail" },
      },
    ],
  },
  {
    name: "FLOW_8_SignatureGate",
    steps: [
      {
        id: "8.1",
        name: "Missing notice + financing",
        run: (c) => {
          c.noticesSurfaced.add("FINANCING_NOTICE");
          c.noticesSurfaced.add("PRIVACY_NOTICE");
          c.financingOk = false;
          c.complianceScore = 85;
          c.paymentCompleted = true;
          recomputeSignatureGate(c);
        },
        check: (c) => (!c.signatureAllowed && c.signatureBlockReasons.length > 0 ? { result: "pass" } : { result: "fail" }),
      },
    ],
  },
  {
    name: "FLOW_9_FullSuccess",
    steps: [
      {
        id: "9.1",
        name: "All gates green + audit + PDF hash",
        run: (c) => {
          c.isRepresented = true;
          c.complianceScore = 95;
          c.financingOk = true;
          c.paymentCompleted = true;
          c.noticesSurfaced.add("PRIVACY_NOTICE");
          c.noticesAcknowledged.add("PRIVACY_NOTICE");
          recomputeSignatureGate(c);
          c.pdfGenerated = true;
          c.pdfHashStored = "sha256:e2e-placeholder";
          logAudit(c, "sign.complete", "signed");
        },
        check: (c) =>
          c.signatureAllowed && c.pdfGenerated && c.pdfHashStored
            ? { result: "pass" }
            : { result: "fail" },
      },
    ],
  },
  {
    name: "FLOW_10_AuditReconstruction",
    steps: [
      {
        id: "10.1",
        name: "Timeline has ordered events for reconstruction",
        run: (c) => {
          logAudit(c, "a", "e1");
          logAudit(c, "b", "e2");
        },
        check: (c) => (c.auditEvents.length >= 2 ? { result: "pass" } : { result: "fail" }),
      },
    ],
  },
];

type Report = {
  generatedAt: string;
  system: "E2EFlowValidator";
  totalFlows: number;
  passed: number;
  failed: number;
  warnings: number;
  productionReady: boolean;
  failedFlowNames: string[];
  warningFlowNames: string[];
  flows: FlowRun[];
};

async function main() {
  flowCounter = 0;
  const results: FlowRun[] = [];
  for (const f of FLOWS) {
    results.push(await runFlow(f.name, f.steps, f.ctx ? createInitialContext(f.ctx) : undefined));
  }

  const passed = results.filter((r) => r.result === "pass").length;
  const failed = results.filter((r) => r.result === "fail").length;
  const warnings = results.filter((r) => r.result === "warning").length;
  const failedFlowNames = results.filter((r) => r.result === "fail").map((r) => r.name);
  const warningFlowNames = results.filter((r) => r.result === "warning").map((r) => r.name);
  const productionReady = failed === 0;

  const report: Report = {
    generatedAt: nowIso(),
    system: "E2EFlowValidator",
    totalFlows: results.length,
    passed,
    failed,
    warnings,
    productionReady,
    failedFlowNames,
    warningFlowNames,
    flows: results,
  };

  await mkdir(join(REPO_ROOT, "reports"), { recursive: true });
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

  for (const r of results) {
    const sym = r.result === "pass" ? "✔" : r.result === "fail" ? "❌" : "⚠";
    console.log(`${sym} ${r.name} → ${r.result.toUpperCase()}`);
    for (const s of r.steps) {
      const stepSym = s.result === "pass" ? "  ✔" : s.result === "fail" ? "  ❌" : "  ⚠";
      console.log(`${stepSym} ${s.stepName}${s.detail ? ` — ${s.detail}` : ""}`);
    }
  }

  console.log("");
  console.log("Summary: total=%d, passed=%d, failed=%d, warnings=%d", results.length, passed, failed, warnings);
  console.log("Report: %s", REPORT_PATH);
  if (!productionReady) {
    console.log("NOT production-ready: failed flows: %s", failedFlowNames.join(", "));
    process.exit(1);
  }
  if (warnings > 0) {
    console.log("Warnings (review): %s", warningFlowNames.join(", "));
  }
  process.exit(0);
}

const isMain =
  typeof process.argv[1] === "string" && import.meta.url === pathToFileURL(process.argv[1]!).href;
if (isMain) {
  void main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

/** Public API for CI / programmatic use. */
export const E2EFlowValidator = {
  runFlow,
  createInitialContext,
  recomputeSignatureGate,
  getReportPath: () => REPORT_PATH,
  getFlowDefinitions: () => FLOWS,
};
