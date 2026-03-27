import { buildBaseSystem } from "../core/ai-prompts";
import type { AiIntent, AiMessages } from "../core/types";

export function buildAdminAiMessages(intent: AiIntent, feature: string, context: Record<string, unknown>): AiMessages | null {
  const system = buildBaseSystem("admin", intent);
  const userJson = JSON.stringify(context, null, 2);

  switch (feature) {
    case "daily_report":
      return {
        system:
          system +
          " Produce an operational summary: activity, revenue, disputes/legal flags, alerts. No PII beyond input.",
        user: `Task: Admin daily/weekly style report.\nContext:\n${userJson}`,
      };
    case "risk_scan":
      return {
        system:
          system +
          " Highlight suspicious patterns from metrics: cancellations, payouts, disputes, reviews — investigative hints only.",
        user: `Task: Risk detection narrative.\nContext:\n${userJson}`,
      };
    case "moderation_summary":
      return {
        system:
          system +
          " Summarize why a listing/dispute may need review based on provided evidence summaries.",
        user: `Task: Moderation assistant.\nContext:\n${userJson}`,
      };
    case "finance_summary":
      return {
        system:
          system +
          " Summarize GST/QST themes, invoices, payouts, overdue — high level from numbers given.",
        user: `Task: Finance assistant.\nContext:\n${userJson}`,
      };
    case "legal_ops":
      return {
        system:
          system +
          " Summarize missing contracts or unresolved ImmoContact-linked issues from provided stats.",
        user: `Task: Legal ops assistant.\nContext:\n${userJson}`,
      };
    case "period_report":
      return {
        system:
          system +
          " Produce daily/weekly/monthly/yearly-style operations summary from KPI JSON only; no execution of admin actions.",
        user: `Task: Period operations report (context includes period).\nContext:\n${userJson}`,
      };
    case "dispute_digest":
      return {
        system:
          system +
          " Summarize dispute themes and priority order for human review — no resolutions or payouts.",
        user: `Task: Dispute digest.\nContext:\n${userJson}`,
      };
    case "legal_risk_report":
      return {
        system:
          system +
          " From aggregated legal-AI audit stats (counts, risk levels, features), produce a short 'Legal Risk Report': themes, repeat misuse patterns, what admins should review first. No PII; investigative hints only.",
        user: `Task: Platform legal risk report for admins.\nContext:\n${userJson}`,
      };
    default:
      return null;
  }
}

export function adminOfflineFallback(feature: string, _context: Record<string, unknown>): string {
  switch (feature) {
    case "daily_report":
      return "Offline mode: Pull metrics from admin finance, disputes, and listings queues for today's snapshot.";
    case "risk_scan":
      return "Offline mode: Sort payouts and disputes by recurrence and value; inspect outliers first.";
    case "moderation_summary":
      return "Offline mode: Compare policy checklist against listing fields and uploaded evidence.";
    case "finance_summary":
      return "Offline mode: Reconcile tax reports with payout batches in the finance hub.";
    case "legal_ops":
      return "Offline mode: Filter contracts not signed and ImmoContact threads awaiting broker response.";
    case "period_report":
      return "Offline mode: Export finance + bookings CSV for the range, then compare to prior period manually.";
    case "dispute_digest":
      return "Offline mode: Sort disputes by age and amount; review evidence attachments before messaging parties.";
    case "legal_risk_report":
      return "Offline mode: Filter ai_interaction_logs where legal_context = true; review high-risk_level rows and repeat feature=intent pairs; correlate with moderation queue.";
    default:
      return "Offline AI: admin tools remain authoritative for enforcement actions.";
  }
}
