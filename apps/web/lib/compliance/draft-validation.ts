import "server-only";

export function validateDraft(_fields: unknown): { valid: boolean; errors: string[] } {
  return { valid: true, errors: [] };
}

export function checkConsistency(_input: {
  listing?: { address?: string | null };
  draft: Record<string, unknown>;
}): { valid: boolean; errors: string[] } {
  return { valid: true, errors: [] };
}
