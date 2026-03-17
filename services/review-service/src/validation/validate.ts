import type { Response } from "express";
import type { z } from "zod";

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(body);
  if (result.success) return { success: true, data: result.data };
  const flat = result.error.flatten();
  const form: string[] = flat.formErrors ?? [];
  const field: string[] = Object.entries(flat.fieldErrors).flatMap(([key, arr]) =>
    (Array.isArray(arr) ? arr : []).map((msg: string) =>
      key === "_errors" ? msg : `${key}: ${msg}`
    )
  );
  const messages = [...form, ...field];
  return { success: false, errors: messages.length > 0 ? messages : ["Validation failed"] };
}

export function validateParams<T>(
  schema: z.ZodSchema<T>,
  params: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  return validateBody(schema, params);
}

export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  query: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  return validateBody(schema, query);
}

export function sendValidationError(res: Response, errors: string[]): void {
  res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: errors[0] ?? "Validation failed",
      details: errors.length > 1 ? errors : undefined,
    },
  });
}
