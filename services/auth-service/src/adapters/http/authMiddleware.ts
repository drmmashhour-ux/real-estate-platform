import type { Request, Response, NextFunction } from "express";
import type { ITokenService } from "../../domain/ports/TokenService.js";

export interface AuthLocals {
  userId: string;
  email: string;
  roles: string[];
}

/* eslint-disable @typescript-eslint/no-namespace -- Express type augmentation */
declare global {
  namespace Express {
    interface Response {
      locals: { auth?: AuthLocals };
    }
  }
}

export function authMiddleware(tokenService: ITokenService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" } });
      return;
    }
    try {
      const payload = tokenService.verifyAccess(token);
      res.locals.auth = { userId: payload.sub, email: payload.email, roles: payload.roles };
      next();
    } catch {
      res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } });
    }
  };
}

export function requireRole(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const hasRole = allowed.some((r) => auth.roles.includes(r));
    if (!hasRole) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
      return;
    }
    next();
  };
}
