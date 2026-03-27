import type { TimelineBadgeVariant } from "@/components/timeline/timeline-badge";

/** Map aggregated admin timeline `source` strings to badge styles. */
export function badgeForAdminTimelineSource(source: string): TimelineBadgeVariant {
  switch (source) {
    case "immo_contact_log":
    case "lead":
      return "contacted";
    case "contract":
    case "legal_contract_audit":
    case "contract_signature":
      return "signed";
    case "payment":
    case "bnhub_invoice":
    case "platform_payment_link":
    case "payment_link":
      return "paid";
    case "booking":
    case "bnhub_booking_event":
    case "booking_message":
      return "scheduled";
    case "dispute":
    case "dispute_message":
    case "dispute_evidence":
    case "dispute_resolution":
      return "flagged";
    case "review":
      return "reviewed";
    case "fsbo_listing":
      return "neutral";
    case "deal":
    case "deal_milestone":
    case "deal_document":
      return "neutral";
    case "platform_payment":
    case "platform_commission":
      return "paid";
    case "crm_interaction":
      return "contacted";
    case "user":
      return "scheduled";
    default:
      return "neutral";
  }
}
