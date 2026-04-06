import { Router, type Request, type Response } from "express";
import { PrismaClient, type Prisma } from "../generated/prisma/index.js";
import { patchMeBodySchema, patchSettingsBodySchema } from "../validation/schemas.js";
import { validateBody, sendValidationError } from "../validation/validate.js";

const prisma = new PrismaClient();

function toPublicUser(user: {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  locale: string | null;
  timezone: string | null;
  verificationStatus: string;
  suspendedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  roles: { role: string }[];
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    locale: user.locale,
    timezone: user.timezone,
    verificationStatus: user.verificationStatus,
    suspendedAt: user.suspendedAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    roles: user.roles.map((r) => r.role),
  };
}

/** Minimal public profile for GET /users/:id (no email unless self or admin) */
function toPublicProfile(user: {
  id: string;
  name: string | null;
  verificationStatus: string;
  createdAt: Date;
  roles: { role: string }[];
}, includeEmail = false) {
  const out: Record<string, unknown> = {
    id: user.id,
    name: user.name,
    verificationStatus: user.verificationStatus,
    createdAt: user.createdAt.toISOString(),
    roles: user.roles.map((r) => r.role),
  };
  if (includeEmail) (out as Record<string, string>).email = (user as { email?: string }).email ?? "";
  return out;
}

export function createUsersRouter(): Router {
  const router = Router();

  /** GET /users/me — current user profile (full). Requires auth. */
  router.get("/me", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const user = await prisma.user.findFirst({
      where: { id: auth.userId, deletedAt: null },
      include: { roles: true },
    });
    if (!user) {
      res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "User not found" } });
      return;
    }
    if (user.suspendedAt) {
      res.status(403).json({ error: { code: "ACCOUNT_SUSPENDED", message: "Account is suspended" } });
      return;
    }
    res.json(toPublicUser(user));
  });

  /** GET /users/me/settings — get current user settings. Requires auth. */
  router.get("/me/settings", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const row = await prisma.userSettings.findUnique({
      where: { userId: auth.userId },
    });
    const settings = (row?.settings as Record<string, unknown>) ?? {};
    res.json({ settings });
  });

  /** PATCH /users/me/settings — update current user settings (merge). Requires auth. */
  router.patch("/me/settings", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const validation = validateBody(patchSettingsBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const existing = await prisma.userSettings.findUnique({
      where: { userId: auth.userId },
    });
    const current = (existing?.settings as Record<string, unknown>) ?? {};
    const merged = { ...current, ...validation.data.settings } as Prisma.InputJsonValue;
    const row = await prisma.userSettings.upsert({
      where: { userId: auth.userId },
      create: { userId: auth.userId, settings: merged },
      update: { settings: merged },
    });
    res.json({ settings: row.settings as Record<string, unknown> });
  });

  /** GET /users/me/sessions — list active sessions for current user. Requires auth. */
  router.get("/me/sessions", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const now = new Date();
    const sessions = await prisma.userSession.findMany({
      where: { userId: auth.userId, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, expiresAt: true },
    });
    res.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
    });
  });

  /** PATCH /users/me — update current user profile. Requires auth. */
  router.patch("/me", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const validation = validateBody(patchMeBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const { name, phone, locale, timezone } = validation.data;
    const user = await prisma.user.findFirst({
      where: { id: auth.userId, deletedAt: null },
      include: { roles: true },
    });
    if (!user) {
      res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "User not found" } });
      return;
    }
    if (user.suspendedAt) {
      res.status(403).json({ error: { code: "ACCOUNT_SUSPENDED", message: "Account is suspended" } });
      return;
    }
    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(locale !== undefined && { locale }),
        ...(timezone !== undefined && { timezone }),
      },
      include: { roles: true },
    });
    res.json(toPublicUser(updated));
  });

  /** GET /users/:id — public profile by id. Requires auth for now; can be relaxed for public profiles. */
  router.get("/:id", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const id = req.params["id"];
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { roles: true },
    });
    if (!user) {
      res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "User not found" } });
      return;
    }
    const includeEmail = auth.userId === id || auth.roles.includes("ADMIN");
    res.json(toPublicProfile(user, includeEmail));
  });

  return router;
}
