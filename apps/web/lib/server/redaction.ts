/**
 * Central redaction utility for sensitive personal information.
 * Strictly aligned with Law 25 (Québec) and OACIQ standards.
 */
export function redactSensitiveData(data: any) {
  if (!data) return data;
  
  const redacted = { ...data };
  
  // General personal identifiers
  delete redacted.firstName;
  delete redacted.lastName;
  delete redacted.email;
  delete redacted.phone;
  delete redacted.personalEmail;
  delete redacted.personalPhone;
  
  // Identity verification information (MUST NOT BE SHARED)
  delete redacted.sin;
  delete redacted.idNumber;
  delete redacted.dateOfBirth;
  delete redacted.identityDocs;
  delete redacted.identityVerification;
  
  // Signatures and sensitive authorization
  delete redacted.signatures;
  delete redacted.signedPage;
  
  // Real Estate specific sensitive data (unless explicit consent given)
  delete redacted.alarmCode;
  delete redacted.lockboxCode;
  
  return redacted;
}

/**
 * Specifically for information dissemination services like Centris/MLS.
 */
export function redactForInformationDissemination(data: any) {
  const base = redactSensitiveData(data);
  // Keep property-specific details but ensure no owner contact is leaked
  delete base.ownerName;
  delete base.ownerContact;
  return base;
}

/**
 * Specifically for unrepresented buyers.
 */
export function redactForUnrepresentedBuyer(data: any) {
  return redactSensitiveData(data);
}

/**
 * Redacts identifying details for property comparables.
 */
export function redactForComparables(data: any) {
  const redacted = { ...data };
  delete redacted.addressLine1;
  delete redacted.unitNumber;
  delete redacted.ownerName;
  delete redacted.photos;
  return redacted;
}

/**
 * Redacts sensitive info from inspection reports.
 */
export function redactInspectionReport(text: string): string {
  if (!text) return text;
  let redacted = text;
  // Redact phone numbers
  redacted = redacted.replace(/\b\d{3}-\d{3}-\d{4}\b/g, "[PHONE REDACTED]");
  // Redact emails
  redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL REDACTED]");
  return redacted;
}
