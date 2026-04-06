import { z } from "zod";
import { Role } from "../../../domain/enums/Role.js";

const normalizedEmail = z.string().email().transform((e) => e.trim().toLowerCase());

export const registerBodySchema = z.object({
  email: normalizedEmail,
  password: z.string().min(8),
  name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
  role: z.nativeEnum(Role).optional(),
});

export const loginBodySchema = z.object({
  email: normalizedEmail,
  password: z.string().min(1),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().email(),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});
