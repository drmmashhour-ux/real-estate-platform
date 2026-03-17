import type { Request, Response, NextFunction } from "express";

const ERROR_TO_HTTP: Record<string, { status: number; code: string }> = {
  EMAIL_ALREADY_EXISTS: { status: 409, code: "EMAIL_ALREADY_EXISTS" },
  INVALID_CREDENTIALS: { status: 401, code: "INVALID_CREDENTIALS" },
  ACCOUNT_SUSPENDED: { status: 403, code: "ACCOUNT_SUSPENDED" },
  INVALID_REFRESH_TOKEN: { status: 401, code: "INVALID_REFRESH_TOKEN" },
  REFRESH_TOKEN_EXPIRED: { status: 401, code: "REFRESH_TOKEN_EXPIRED" },
  USER_NOT_FOUND: { status: 404, code: "USER_NOT_FOUND" },
  INVALID_TOKEN_TYPE: { status: 401, code: "INVALID_TOKEN" },
};

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const message = err instanceof Error ? err.message : "INTERNAL_ERROR";
  const mapping = ERROR_TO_HTTP[message];
  if (mapping) {
    res.status(mapping.status).json({ error: { code: mapping.code, message } });
    return;
  }
  if (err && typeof (err as { name: string }).name === "string" && (err as { name: string }).name === "JsonWebTokenError") {
    res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } });
    return;
  }
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } });
}
