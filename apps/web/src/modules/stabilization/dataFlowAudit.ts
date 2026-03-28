import { join } from "node:path";
import type { AuditResult, StabilizationIssue } from "./types";
import { walkTsFiles, readTextSafe, relWeb } from "./fsUtils";

const PIPELINE_MARKERS: { needle: RegExp; label: string; files: string[] }[] = [
  { needle: /logImmoContactEvent|immo-contact-log/i, label: "Immo contact logging", files: [] },
  { needle: /stripe.*webhook|constructEvent/i, label: "Stripe webhook verification", files: [] },
  { needle: /booking.*status|BookingStatus/i, label: "Booking state", files: [] },
  { needle: /growthAiConversation|touchGrowthAiContext/i, label: "Growth AI conversation", files: [] },
];

export function runDataFlowAudit(webRoot: string): AuditResult {
  const issues: StabilizationIssue[] = [];
  const files = walkTsFiles(webRoot).filter((f) => !f.includes("node_modules") && !f.endsWith(".test.ts"));

  for (const file of files) {
    const content = readTextSafe(file);
    if (!content) continue;
    for (const m of PIPELINE_MARKERS) {
      if (m.needle.test(content)) {
        m.files.push(relWeb(webRoot, file));
      }
    }
  }

  const webhook = PIPELINE_MARKERS.find((p) => p.label.includes("Stripe webhook"));
  if (webhook && webhook.files.length === 0) {
    issues.push({
      severity: "CRITICAL",
      code: "FLOW_NO_WEBHOOK",
      message: "No Stripe webhook / constructEvent usage found under apps/web",
    });
  }

  const immo = PIPELINE_MARKERS.find((p) => p.label.includes("Immo"));
  if (immo && immo.files.length < 2) {
    issues.push({
      severity: "MEDIUM",
      code: "FLOW_IMMO_SPARSE",
      message: "Few immo-contact logging touchpoints — verify CRM → lead pipeline is wired",
      detail: String(immo.files.length),
    });
  }

  const checkout = join(webRoot, "app", "api", "stripe", "checkout", "route.ts");
  const webhookRoute = join(webRoot, "app", "api", "stripe", "webhook", "route.ts");
  if (!readTextSafe(checkout)) {
    issues.push({ severity: "HIGH", code: "FLOW_CHECKOUT_MISSING", message: "Missing app/api/stripe/checkout/route.ts" });
  }
  if (!readTextSafe(webhookRoute)) {
    issues.push({ severity: "CRITICAL", code: "FLOW_WEBHOOK_ROUTE_MISSING", message: "Missing app/api/stripe/webhook/route.ts" });
  }

  return {
    name: "dataFlowAudit",
    issues,
    stats: Object.fromEntries(PIPELINE_MARKERS.map((p) => [p.label, p.files.length])),
  };
}
