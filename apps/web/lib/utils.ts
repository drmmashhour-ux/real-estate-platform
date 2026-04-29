/**
 * Tailwind-friendly class name merge (minimal; no tailwind-merge dependency).
 */
export function cn(...inputs: (string | undefined | null | false | 0)[]): string {
  return inputs.filter(Boolean).join(" ");
}
