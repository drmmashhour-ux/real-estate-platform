import { logInfo, logWarn, logError } from "@/lib/logger";

const P = "[messaging]";

export function logMessagingInfo(msg: string, meta?: Record<string, unknown>) {
  logInfo(`${P} ${msg}`, meta);
}

export function logMessagingWarn(msg: string, meta?: Record<string, unknown>) {
  logWarn(`${P} ${msg}`, meta);
}

export function logMessagingError(msg: string, meta?: Record<string, unknown>) {
  logError(`${P} ${msg}`, meta);
}
