import { prisma } from "@/lib/db";

export async function logTurboDraftEvent(args: {
  draftId?: string;
  userId?: string;
  eventKey: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  payload?: any;
}) {
  try {
    // @ts-ignore
    await prisma.turboDraftAuditLog.create({
      data: {
        draftId: args.draftId,
        userId: args.userId,
        eventKey: args.eventKey,
        severity: args.severity,
        payloadJson: args.payload,
      },
    });
  } catch (err) {
    console.error("[TurboDraftAuditLogger] Failed to log event", err);
  }
}
