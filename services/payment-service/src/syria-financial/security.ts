import { SyriaFinancialError } from "./errors.js";

const SENSITIVE_KEY_PATTERN = /(card|pan|cvv|cvc|secret|password|pin|token|private|iban|accountNumber)/i;
const CARD_LIKE_NUMBER_PATTERN = /\b(?:\d[ -]*?){13,19}\b/;

export type JsonSafeValue =
  | string
  | number
  | boolean
  | null
  | JsonSafeValue[]
  | { [key: string]: JsonSafeValue };

export function redactFinancialSecrets(value: unknown): JsonSafeValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    return CARD_LIKE_NUMBER_PATTERN.test(value) ? "[REDACTED]" : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => redactFinancialSecrets(item));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : redactFinancialSecrets(nested),
      ]),
    );
  }

  return String(value);
}

export function assertNoSensitiveFinancialPayload(payload: unknown): void {
  const serialized = JSON.stringify(payload ?? {});
  if (CARD_LIKE_NUMBER_PATTERN.test(serialized)) {
    throw new SyriaFinancialError(
      "SENSITIVE_DATA_REJECTED",
      "Raw card or bank-account-like data is not accepted by the Syria financial foundation.",
      { statusCode: 400 },
    );
  }
}
