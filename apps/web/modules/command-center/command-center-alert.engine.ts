import type { EngineAlert, UnifiedCommandContext } from "./command-center-ai.types";
import type { CommandCenterAlertSeverity, CommandCenterAlertType } from "@prisma/client";

function key(type: CommandCenterAlertType, entityType: string, entityId: string): string {
  return `${type}:${entityType}:${entityId}`;
}

/**
 * Deterministic, explainable alerts — visibility only; no side effects.
 */
export function buildCommandAlerts(context: UnifiedCommandContext): EngineAlert[] {
  const out: EngineAlert[] = [];
  const seen = new Set<string>();

  const add = (a: EngineAlert) => {
    const k = key(a.type, a.entityType, a.entityId);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(a);
  };

  if (context.conflictDeals > 0) {
    add({
      type: "COMPLIANCE",
      severity: "CRITICAL",
      entityType: "deal_aggregate",
      entityId: context.userId,
      title: "Conflict disclosure backlog",
      description: `${context.conflictDeals} active deal(s) are flagged for conflict disclosure. Resolve before further steps that could prejudice a party.`,
      actionLabel: "Open compliance command center",
      actionUrl: "/dashboard/broker/compliance/command-center",
    });
  }

  for (const d of context.deals) {
    if (d.stage !== "CONFLICT_REQUIRES_DISCLOSURE") continue;
    add({
      type: "COMPLIANCE",
      severity: "CRITICAL",
      entityType: "deal",
      entityId: d.dealId,
      title: `Deal ${d.dealCode ?? d.dealId.slice(0, 8)} — conflict disclosure`,
      description: d.blocker ?? "Conflict disclosure must be cleared with your compliance workflow.",
      actionLabel: "Open deal",
      actionUrl: d.href,
    });
  }

  for (const s of context.signatureQueue) {
    if (s.severity === "LOW") continue;
    const type: CommandCenterAlertType =
      s.kind === "closing_step" ? "CLOSING" : s.kind === "investor_packet" ? "INVESTOR" : "APPROVAL";
    const sev: CommandCenterAlertSeverity = s.severity === "CRITICAL" ? "CRITICAL" : "HIGH";
    add({
      type,
      severity: sev,
      entityType: s.kind,
      entityId: s.id,
      title: s.title,
      description:
        s.kind === "action_pipeline" ?
          "Autopilot prepared a binding step. Review and sign in the signature center — execution does not run silently."
        : "Document or approval is waiting for broker review and signature.",
      actionLabel: "Review & sign",
      actionUrl: s.href,
    });
  }

  for (const d of context.deals) {
    const cp = d.closeProbability ?? 0;
    if (cp >= 0.72 && d.needsBrokerSignature) {
      add({
        type: "OPPORTUNITY",
        severity: "HIGH",
        entityType: "deal",
        entityId: d.dealId,
        title: `High-probability deal awaiting your signature — ${d.dealCode ?? d.dealId.slice(0, 8)}`,
        description: `Modeled close probability ~${Math.round(cp * 100)}%. ${d.blocker ?? d.nextStep}`,
        actionLabel: "Open deal",
        actionUrl: d.href,
      });
    }
    if ((d.riskLevel === "HIGH" || d.riskLevel === "CRITICAL") && cp >= 0.45) {
      add({
        type: "RISK",
        severity: "HIGH",
        entityType: "deal",
        entityId: d.dealId,
        title: `Elevated risk with momentum — ${d.dealCode ?? d.dealId.slice(0, 8)}`,
        description:
          `Risk band ${d.riskLevel}. ${d.blocker ?? "Validate material facts and supervision notes before advancing."}`,
        actionLabel: "Review deal",
        actionUrl: d.href,
      });
    }
  }

  for (const c of context.closings) {
    if (c.blockedChecklist > 0) {
      add({
        type: "CLOSING",
        severity: "CRITICAL",
        entityType: "closing",
        entityId: c.dealId,
        title: `Closing blocked — ${c.dealId.slice(0, 8)}`,
        description: `${c.blockedChecklist} checklist item(s) are blocked. Notary and disbursement may be at risk.`,
        actionLabel: "Open closing workspace",
        actionUrl: c.href,
      });
    } else if (c.pendingSignatures > 0 && c.closingDate) {
      const days = (new Date(c.closingDate).getTime() - Date.now()) / 864e5;
      if (days <= 10 && days >= -1) {
        add({
          type: "CLOSING",
          severity: "HIGH",
          entityType: "closing",
          entityId: c.dealId,
          title: `Signing window tight — ${c.dealId.slice(0, 8)}`,
          description: `${c.pendingSignatures} required signature(s) still pending near the target closing date.`,
          actionLabel: "Open deal",
          actionUrl: c.href,
        });
      }
    }
  }

  for (const inv of context.investors) {
    if (/PROPOSED|PENDING/i.test(inv.decisionStatus)) {
      add({
        type: "INVESTOR",
        severity: "MEDIUM",
        entityType: "lecipm_pipeline_deal",
        entityId: inv.id,
        title: `Investor workflow waiting — ${inv.title.slice(0, 80)}`,
        description: `Stage ${inv.stage}; status ${inv.decisionStatus}. Confirm subscription packet and internal approvals.`,
        actionLabel: "Open investor desk",
        actionUrl: inv.href,
      });
    }
  }

  if (context.finance.invoicesOverdue > 0) {
    add({
      type: "FINANCE",
      severity: "CRITICAL",
      entityType: "invoice_aggregate",
      entityId: context.userId,
      title: "Overdue receivables",
      description: `${context.finance.invoicesOverdue} invoice(s) are overdue. Escalate collection and verify tax treatment.`,
      actionLabel: "Review invoices",
      actionUrl: "/dashboard/broker/financial/transactions",
    });
  } else if (context.finance.invoicesOpen > 6) {
    add({
      type: "FINANCE",
      severity: "MEDIUM",
      entityType: "invoice_aggregate",
      entityId: context.userId,
      title: "Invoice queue depth",
      description: `${context.finance.invoicesOpen} open invoice(s). Keep GST/QST positions aligned before quarter-end.`,
      actionLabel: "Finance hub",
      actionUrl: "/dashboard/broker/financial/transactions",
    });
  }

  add({
    type: "FINANCE",
    severity: "LOW",
    entityType: "tax_calendar",
    entityId: context.userId,
    title: "GST / QST filing hygiene",
    description:
      context.finance.taxHint ??
      "Confirm filing calendar with your accountant — automated due-date ingestion is advisory only.",
    actionLabel: "Revenu Québec hub",
    actionUrl: "/dashboard/broker/financial/revenu-quebec",
  });

  add({
    type: "COMPLIANCE",
    severity: "MEDIUM",
    entityType: "regulatory_calendar",
    entityId: context.userId,
    title: "OACIQ / AMF obligations",
    description:
      "Review upcoming licence, continuing education, and advertising filings. This card is a reminder — validate against your obligations register.",
    actionLabel: "Compliance overview",
    actionUrl: "/dashboard/broker/compliance",
  });

  for (const note of context.legacy.summary.trustRisk.complianceNotes.slice(0, 4)) {
    add({
      type: "COMPLIANCE",
      severity: "MEDIUM",
      entityType: "trust_panel",
      entityId: context.userId,
      title: "Compliance note (trust panel)",
      description: note,
      actionLabel: "Trust & disputes",
      actionUrl: "/dashboard/broker/trust",
    });
  }

  for (const row of context.legacy.summary.priorityDeals) {
    if ((row.score ?? 0) >= 82 && row.riskHint?.toLowerCase().includes("price")) {
      add({
        type: "OPPORTUNITY",
        severity: "MEDIUM",
        entityType: "deal",
        entityId: row.id,
        title: `Pricing attention — ${row.label}`,
        description: row.riskHint ?? "Listing or offer economics may be misaligned with market signals.",
        actionLabel: "Open deal",
        actionUrl: `/dashboard/broker/deals#deal-${row.id}`,
      });
      break;
    }
  }

  out.sort((a, b) => {
    const sev = (s: CommandCenterAlertSeverity) =>
      s === "CRITICAL" ? 4 : s === "HIGH" ? 3 : s === "MEDIUM" ? 2 : 1;
    return sev(b.severity) - sev(a.severity);
  });

  return out;
}
