type LogTag = "api" | "compliance" | "ai" | "autopilot" | "security" | "system";

export function logInfo(tag: LogTag, message: string, detail?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${tag}] INFO: ${message}`, detail ? JSON.stringify(detail) : "");
}

export function logError(tag: LogTag, message: string, error?: any, traceId?: string) {
  const timestamp = new Date().toISOString();
  console.error(
    `[${timestamp}] [${tag}] ERROR: ${message}`,
    JSON.stringify({
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      traceId,
    })
  );
}

export function logSecurity(message: string, detail?: any) {
  logInfo("security", message, detail);
}

export function logAudit(action: string, entity: string, entityId: string | null, userId?: string) {
  logInfo("system", `AUDIT: ${action} on ${entity}:${entityId} by ${userId || "system"}`);
}
