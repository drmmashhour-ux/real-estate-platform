import type { Request, Response, NextFunction } from "express";

/**
 * Simple auth context: sets res.locals.userId from X-User-Id header.
 * Replace with JWT or API gateway validation in production.
 */
export function requireUserId(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers["x-user-id"];
  if (typeof userId !== "string" || !userId.trim()) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "X-User-Id required" } });
    return;
  }
  res.locals.userId = userId.trim();
  next();
}

declare global {
  namespace Express {
    interface Locals {
      userId?: string;
    }
  }
}
