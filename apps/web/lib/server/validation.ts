import { z } from "zod";
import { createErrorResponse } from "./error-handler";

/**
 * Validates request body against a Zod schema.
 * Returns the parsed data or a NextResponse error.
 */
export async function validateRequest<T>(request: Request, schema: z.Schema<T>) {
  try {
    const body = await request.json();
    return { success: true, data: schema.parse(body) } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { 
        success: false, 
        errorResponse: createErrorResponse(`Validation failed: ${message}`, "VALIDATION_FAILED", 400) 
      } as const;
    }
    return { 
      success: false, 
      errorResponse: createErrorResponse("Invalid JSON payload", "INVALID_JSON", 400) 
    } as const;
  }
}

// Example Schemas for Core Engines
export const schemas = {
  turboDraft: z.object({
    listingId: z.string().optional(),
    persona: z.enum(["BUYER", "SELLER", "BROKER"]),
    answers: z.record(z.any()),
  }),
  aiCorrection: z.object({
    draftId: z.string(),
    instruction: z.string().min(3),
  }),
  signatureAttempt: z.object({
    entityId: z.string(),
    entityType: z.enum(["DRAFT", "DEAL"]),
    consent: z.boolean().refine(val => val === true, "Must consent to electronic signature"),
  })
};
