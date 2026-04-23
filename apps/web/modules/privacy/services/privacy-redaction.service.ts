export class PrivacyRedactionService {
  /**
   * Redacts personal information for sharing with information dissemination services (e.g. Centris).
   */
  static redactForInformationDisseminationService(data: any): any {
    const redacted = { ...data };
    // Redact ID verification clauses
    delete redacted.sin;
    delete redacted.idNumber;
    delete redacted.dateOfBirth;
    // Keep minimum necessary for listing but hide personal contact
    delete redacted.phone;
    delete redacted.personalEmail;
    return redacted;
  }

  /**
   * Redacts for a buyer broker.
   */
  static redactForBuyerBroker(data: any): any {
    const redacted = { ...data };
    // OACIQ: hide information not needed for the offer phase
    delete redacted.alarmCode;
    delete redacted.lockboxCode;
    // Names in inspection reports might need redaction if unrelated
    return redacted;
  }

  /**
   * Redacts for an unrepresented buyer.
   */
  static redactForUnrepresentedBuyer(data: any): any {
    const redacted = { ...data };
    // Most sensitive info should be hidden except facts relevant to property state
    delete redacted.ownerPhone;
    delete redacted.ownerEmail;
    return redacted;
  }

  /**
   * Redacts inspection reports.
   */
  static redactInspectionReport(reportText: string): string {
    // Regex or LLM based redaction of personal names, phone numbers, etc.
    let redacted = reportText;
    // Simple placeholder logic for now
    redacted = redacted.replace(/\b\d{3}-\d{3}-\d{4}\b/g, "[PHONE REDACTED]");
    return redacted;
  }

  /**
   * Generic internal transfer redaction.
   */
  static redactForInterdepartmentTransfer(data: any, toDepartment: string): any {
    const redacted = { ...data };
    if (toDepartment !== "MORTGAGE" && toDepartment !== "FINANCE") {
      delete redacted.bankDetails;
      delete redacted.preApprovalAmount;
    }
    return redacted;
  }

  /**
   * Redacts identifying details for comparables given to clients.
   */
  static redactForComparables(data: any): any {
    const redacted = { ...data };
    // Redact specific address and photos until lawful use is appropriate
    delete redacted.addressLine1;
    delete redacted.unitNumber;
    delete redacted.ownerName;
    // Keep general area, beds/baths, and sold price (if allowed)
    return redacted;
  }
}
