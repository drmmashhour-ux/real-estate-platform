import { join } from "node:path";
import type { AuditResult, StabilizationIssue } from "./types";
import { walkTsFiles, readTextSafe, relWeb } from "./fsUtils";

export function runSecurityAudit(webRoot: string): AuditResult {
  const issues: StabilizationIssue[] = [];
  const files = walkTsFiles(webRoot).filter((f) => !f.includes("node_modules") && !f.endsWith(".test.ts"));

  let webhookSig = 0;
  let adminLayoutAuth = false;

  const webhookPath = join(webRoot, "app", "api", "stripe", "webhook", "route.ts");
  const webhookSrc = readTextSafe(webhookPath);
  if (webhookSrc) {
    if (!webhookSrc.includes("constructEvent") && !webhookSrc.includes("stripe-signature")) {
      issues.push({
        severity: "CRITICAL",
        code: "SEC_WEBHOOK_NO_SIGNATURE",
        message: "Stripe webhook route should verify signature (constructEvent / stripe-signature header)",
        file: "app/api/stripe/webhook/route.ts",
      });
    } else {
      webhookSig = 1;
    }
  }

  const adminLayout = join(webRoot, "app", "admin", "layout.tsx");
  const adminLay = readTextSafe(adminLayout);
  if (adminLay) {
    adminLayoutAuth =
      adminLay.includes("getServerSession") ||
      adminLay.includes("auth") ||
      adminLay.includes("redirect") ||
      adminLay.includes("protected");
    if (!adminLayoutAuth) {
      issues.push({
        severity: "HIGH",
        code: "SEC_ADMIN_LAYOUT",
        message: "app/admin/layout.tsx — confirm auth/role gating (session, redirect, or middleware)",
        file: "app/admin/layout.tsx",
      });
    }
  }

  for (const file of files) {
    const rel = relWeb(webRoot, file);
    if (rel.includes("stabilization")) continue;
    const content = readTextSafe(file);
    if (!content) continue;
    if (/eval\s*\(/.test(content) && !content.includes("eslint")) {
      issues.push({ severity: "HIGH", code: "SEC_EVAL", message: "eval() usage detected", file: rel });
    }
    if (/\bdangerouslySetInnerHTML\b/.test(content) && !content.includes("sanitize")) {
      issues.push({
        severity: "MEDIUM",
        code: "SEC_INNER_HTML",
        message: "dangerouslySetInnerHTML — verify sanitization",
        file: rel,
      });
    }
  }

  return {
    name: "securityAudit",
    issues: issues.slice(0, 40),
    stats: {
      stripeWebhookSignatureOk: webhookSig,
      adminLayoutAuthHeuristic: adminLayoutAuth,
    },
  };
}
