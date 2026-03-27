import type { RequiredDocumentCategory } from "@prisma/client";

export type IntakeNotifyArgs = {
  brokerClientId: string;
  category?: RequiredDocumentCategory;
};

/**
 * Stubs for future email/SMS/in-app. Log intent only.
 */
export function notifyRequiredDocumentRequested(_args: IntakeNotifyArgs): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[intake-notifications] document requested", _args.brokerClientId);
  }
}

export function notifyDocumentApproved(_args: IntakeNotifyArgs): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[intake-notifications] document approved", _args.brokerClientId);
  }
}

export function notifyDocumentRejected(_args: IntakeNotifyArgs): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[intake-notifications] document rejected", _args.brokerClientId);
  }
}

export function notifyIntakeCompleted(_args: { brokerClientId: string }): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[intake-notifications] intake completed", _args.brokerClientId);
  }
}

export function notifyIntakeNeedsAttention(_args: { brokerClientId: string; reason: string }): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[intake-notifications] intake needs attention", _args);
  }
}
