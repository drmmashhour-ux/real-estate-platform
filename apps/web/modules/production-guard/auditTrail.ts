import { prisma } from "@repo/db";

export async function logProductionAuditEvent(
  draftId: string,
  userId: string | null,
  action: string,
  payload: any,
  ipAddress: string | null = null,
  severity: "INFO" | "WARNING" | "CRITICAL" = "INFO"
) {
  // Use existing TurboDraftAuditLog if available
  try {
    const data: any = {
      draftId,
      userId,
      eventKey: action,
      payloadJson: { ...payload, ipAddress },
      severity,
      createdAt: new Date()
    };
    
    await (prisma as any).turboDraftAuditLog.create({ data });
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}

export function generateDiff(oldData: any, newData: any) {
  const diff: any = {};
  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
  
  allKeys.forEach(key => {
    if (JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key])) {
      diff[key] = {
        old: oldData?.[key],
        new: newData?.[key]
      };
    }
  });
  
  return diff;
}
