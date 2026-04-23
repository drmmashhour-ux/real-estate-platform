import { Prisma } from "@prisma/client";

export type DbErrorKind = "auth" | "network" | "timeout" | "schema" | "unknown";

/**
 * Coarse taxonomy for logs and retry policy. Never includes credentials.
 */
export function classifyDbError(err: unknown): { kind: DbErrorKind; code?: string; summary: string } {
  const summary = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const code = err.code;
    // https://www.prisma.io/docs/reference/api-reference/error-reference
    if (code === "P1000") {
      return { kind: "auth", code, summary };
    }
    if (code === "P1001" || code === "P1017") {
      return { kind: "network", code, summary };
    }
    if (code === "P2021" || code === "P2010" || code === "P2009") {
      return { kind: "schema", code, summary };
    }
    return { kind: "unknown", code, summary };
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    const msg = err.message;
    if (/timeout|ETIMEDOUT|timed out/i.test(msg)) {
      return { kind: "timeout", summary };
    }
    if (/auth|password|denied|certificate/i.test(msg)) {
      return { kind: "auth", summary };
    }
    if (/connect|ECONNREFUSED|ENOTFOUND|network|unreachable/i.test(msg)) {
      return { kind: "network", summary };
    }
    return { kind: "unknown", summary };
  }

  if (err instanceof Error) {
    const name = err.name;
    const msg = err.message;
    if (name === "AbortError" || /timeout|ETIMEDOUT|timed out/i.test(msg)) {
      return { kind: "timeout", summary };
    }
    if (/ECONNRESET|ECONNREFUSED|ENOTFOUND|socket|network|unreachable/i.test(msg)) {
      return { kind: "network", summary };
    }
    if (/28P01|password authentication|authentication failed/i.test(msg)) {
      return { kind: "auth", summary };
    }
  }

  return { kind: "unknown", summary };
}

export function isTransientDbFailure(classification: { kind: DbErrorKind }): boolean {
  return classification.kind === "network" || classification.kind === "timeout";
}
