import { getPublicEnv } from "@/lib/runtime-env";

export type LogLevel = "info" | "warn" | "error" | "security" | "finance";

export type LogContext = {
  requestId?: string | null;
  userId?: string | null;
  tenantId?: string | null;
  action?: string;
  /** Non-sensitive metadata only */
  meta?: Record<string, unknown>;
};

const isVerbose =
  process.env.NODE_ENV !== "production" || process.env.LOG_VERBOSE === "1";

function line(level: LogLevel, msg: string, ctx?: LogContext) {
  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg,
    env: getPublicEnv(),
    service: "web-app",
  };
  if (ctx?.requestId) payload.requestId = ctx.requestId;
  if (ctx?.userId) payload.userId = ctx.userId;
  if (ctx?.tenantId) payload.tenantId = ctx.tenantId;
  if (ctx?.action) payload.action = ctx.action;
  if (ctx?.meta) payload.meta = ctx.meta;
  return JSON.stringify(payload);
}

export function logInfo(msg: string, ctx?: LogContext) {
  console.log(line("info", msg, ctx));
}

export function logWarning(msg: string, ctx?: LogContext) {
  console.warn(line("warn", msg, ctx));
}

export function logError(msg: string, ctx?: LogContext & { err?: unknown }) {
  const { err, meta: ctxMeta, ...rest } = ctx ?? {};
  const meta: Record<string, unknown> = { ...(ctxMeta ?? {}) };
  if (err instanceof Error) {
    meta.errorName = err.name;
    meta.errorMessage = err.message;
    if (isVerbose) meta.errorStack = err.stack;
  }
  console.error(line("error", msg, { ...rest, meta }));
}

export function logSecurityEvent(msg: string, ctx?: LogContext) {
  console.warn(line("security", msg, ctx));
}

export function logFinanceEvent(msg: string, ctx?: LogContext) {
  console.log(line("finance", msg, ctx));
}
