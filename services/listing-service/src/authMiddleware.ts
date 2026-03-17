import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

export interface AuthLocals {
  userId: string;
  email: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Response {
      locals: { auth?: AuthLocals };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" } });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as {
      sub: string;
      email?: string;
      roles?: string[];
      type?: string;
    };
    if (decoded.type && decoded.type !== "access") {
      res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Access token required" } });
      return;
    }
    res.locals.auth = {
      userId: decoded.sub,
      email: decoded.email ?? "",
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
    };
    next();
  } catch {
    res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } });
  }
}

export function requireOwnerOrAdmin(ownerId: string): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    if (auth.userId !== ownerId && !auth.roles.includes("ADMIN")) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Not the property owner or admin" } });
      return;
    }
    next();
  };
}
