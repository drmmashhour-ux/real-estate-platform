/** Normalize guest input to stored BNH-XXXXXX shape when possible. */
export function normalizeBnhubConfirmationCode(raw: string): string {
  let s = raw.trim().toUpperCase().replace(/\s+/g, "");
  s = s.replace(/[^A-Z0-9-]/g, "");
  if (s.startsWith("BNH")) {
    const rest = s.replace(/^BNH-?/, "");
    if (/^[A-Z0-9]{6}$/.test(rest)) return `BNH-${rest}`;
  }
  return s;
}
