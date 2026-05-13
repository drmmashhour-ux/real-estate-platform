import type { FinancialMetadata } from "./types.js";

const secretKeyPattern = /(card|cvv|cvc|pan|secret|password|token|authorization|iban|accountNumber)/i;

export function sanitizeFinancialMetadata(metadata: FinancialMetadata): FinancialMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      secretKeyPattern.test(key) ? "[REDACTED]" : value,
    ]),
  );
}

export function assertNoRawCardData(metadata: FinancialMetadata): void {
  const unsafeKey = Object.keys(metadata).find((key) => /(card|cvv|cvc|pan)/i.test(key));
  if (unsafeKey) {
    throw new Error(`Raw card data is not allowed in financial metadata: ${unsafeKey}`);
  }
}

export function safeFinancialLogPayload(payload: FinancialMetadata): FinancialMetadata {
  return sanitizeFinancialMetadata(payload);
}
