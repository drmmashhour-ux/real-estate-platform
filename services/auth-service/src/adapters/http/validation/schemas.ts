import { z } from "zod";
import { Role } from "../../../domain/enums/Role.js";

const roleEnum = z.nativeEnum(Role).optional();

/** Email: non-empty, trimmed, valid format */
const emailSchema = z
  .string()
  .min(1, "email is required")
  .email("invalid email format")
  .transform((s) => s.trim().toLowerCase());

/** Password: min 8 chars, at least one letter and one number (optional strength rule) */
const passwordSchema = z
  .string()
  .min(8, "password must be at least 8 characters")
  .max(128, "password must be at most 128 characters");

/** Optional string (null/undefined → null) */
const optionalString = z
  .string()
  .optional()
  .nullable()
  .transform((s) => s?.trim() || null);

/** Locale: e.g. en_CA, fr_CA */
const localeSchema = z.string().regex(/^[a-z]{2}(_[A-Z]{2})?$/).optional().nullable();

export const registerBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: optionalString,
  phone: optionalString,
  locale: localeSchema,
  role: roleEnum.optional(),
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "password is required"),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

export const forgotPasswordBodySchema = z.object({
  email: emailSchema,
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1, "token is required"),
  newPassword: passwordSchema,
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
