import type {
  DealDocumentRefType,
  DealDocumentStatus,
  DealParticipantRole,
  DealPaymentStatus,
  DealPaymentType,
  DealPriorityLabel,
  DealRoomStage,
  DealTaskStatus,
} from "@prisma/client";

const STAGES: DealRoomStage[] = [
  "new_interest",
  "qualified",
  "visit_scheduled",
  "visit_completed",
  "offer_preparing",
  "offer_submitted",
  "negotiating",
  "accepted",
  "documents_pending",
  "payment_pending",
  "closed",
  "lost",
];

const PRIORITIES: DealPriorityLabel[] = ["low", "medium", "high"];
const TASK_STATUSES: DealTaskStatus[] = ["todo", "in_progress", "done", "blocked"];
const DOC_STATUSES: DealDocumentStatus[] = ["requested", "in_progress", "review_required", "completed"];
const DOC_REFS: DealDocumentRefType[] = ["uploaded_file", "legal_form_draft", "external"];
const PAY_TYPES: DealPaymentType[] = ["listing_fee", "booking_payment", "deposit", "commission", "lead_fee"];
const PAY_STATUSES: DealPaymentStatus[] = ["pending", "paid", "failed", "waived"];
const PARTICIPANT_ROLES: DealParticipantRole[] = ["broker", "buyer", "seller", "client", "admin", "guest"];

export function parseStage(v: unknown): DealRoomStage | null {
  return typeof v === "string" && STAGES.includes(v as DealRoomStage) ? (v as DealRoomStage) : null;
}

export function parsePriority(v: unknown): DealPriorityLabel | null {
  return typeof v === "string" && PRIORITIES.includes(v as DealPriorityLabel) ? (v as DealPriorityLabel) : null;
}

export function parseTaskStatus(v: unknown): DealTaskStatus | null {
  return typeof v === "string" && TASK_STATUSES.includes(v as DealTaskStatus) ? (v as DealTaskStatus) : null;
}

export function parseDocumentStatus(v: unknown): DealDocumentStatus | null {
  return typeof v === "string" && DOC_STATUSES.includes(v as DealDocumentStatus) ? (v as DealDocumentStatus) : null;
}

export function parseDocumentRefType(v: unknown): DealDocumentRefType | null {
  return typeof v === "string" && DOC_REFS.includes(v as DealDocumentRefType) ? (v as DealDocumentRefType) : null;
}

export function parsePaymentType(v: unknown): DealPaymentType | null {
  return typeof v === "string" && PAY_TYPES.includes(v as DealPaymentType) ? (v as DealPaymentType) : null;
}

export function parsePaymentStatus(v: unknown): DealPaymentStatus | null {
  return typeof v === "string" && PAY_STATUSES.includes(v as DealPaymentStatus) ? (v as DealPaymentStatus) : null;
}

export function parseParticipantRole(v: unknown): DealParticipantRole | null {
  return typeof v === "string" && PARTICIPANT_ROLES.includes(v as DealParticipantRole)
    ? (v as DealParticipantRole)
    : null;
}
