/** Admin fraud / reputation moderation — mirrored Prisma enums (lowercase). */

export type FraudCaseStatus = "open" | "under_review" | "confirmed_fraud" | "false_positive" | "resolved";

export type ReviewStatus = "pending" | "published" | "hidden" | "flagged";

export type ComplaintStatus = "open" | "under_review" | "confirmed" | "dismissed" | "resolved";
