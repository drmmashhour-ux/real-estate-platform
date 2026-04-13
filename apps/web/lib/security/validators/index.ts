/**
 * Shared server-side validation for API routes. Always validate here — never rely on client-only checks.
 */
import { PlatformRole } from "@prisma/client";
import { z } from "zod";

/** UUID v4-style (Prisma `uuid()` ids in this codebase). */
export const uuidStringSchema = z.string().uuid();

/** Non-empty trimmed string with max length. */
export function boundedString(max: number) {
  return z.string().trim().min(1).max(max);
}

export const emailSchema = z.string().trim().toLowerCase().email().max(320);

/** ISO date string (YYYY-MM-DD) — validate before DB. */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid date format");

/** Positive integer cents (money). */
export const positiveIntCentsSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

/** Safe URL (https preferred for redirects). */
export const safeHttpsUrlSchema = z.string().url().max(2048).refine(
  (u) => {
    try {
      const p = new URL(u).protocol;
      return p === "https:" || p === "http:";
    } catch {
      return false;
    }
  },
  { message: "invalid url" },
);

/** When an API accepts a role string, validate against the Prisma enum (never trust raw strings). */
export const platformRoleSchema = z.nativeEnum(PlatformRole);

export function parseJsonBody<T>(schema: z.ZodType<T>, raw: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const r = schema.safeParse(raw);
  if (!r.success) {
    const msg = r.error.flatten().formErrors.join("; ") || "invalid body";
    return { ok: false, error: msg };
  }
  return { ok: true, data: r.data };
}

/** Multer-style file: allowlist by extension (defense in depth — still scan in storage pipeline). */
export const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
export const allowedDocExtensions = new Set([".pdf", ".doc", ".docx"]);

export function safeFilenameExtension(name: string): string | null {
  const lower = name.trim().toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot === -1) return null;
  return lower.slice(dot);
}
