import { 
  redactSensitiveData, 
  redactForInformationDissemination, 
  redactForUnrepresentedBuyer, 
  redactForComparables, 
  redactInspectionReport 
} from "@/lib/server/redaction";

/**
 * Service wrapper for redaction logic, used across the platform.
 * Aligned with Law 25 and OACIQ real-estate practice guidance.
 */
export class PrivacyRedactionService {
  static redactForInformationDisseminationService(data: any): any {
    return redactForInformationDissemination(data);
  }

  static redactForBuyerBroker(data: any): any {
    const redacted = redactSensitiveData(data);
    // OACIQ: buyer brokers need some info but not alarm/lockbox codes by default
    delete redacted.alarmCode;
    delete redacted.lockboxCode;
    return redacted;
  }

  static redactForUnrepresentedBuyer(data: any): any {
    return redactForUnrepresentedBuyer(data);
  }

  static redactInspectionReport(reportText: string): string {
    return redactInspectionReport(reportText);
  }

  static redactForInterdepartmentTransfer(data: any, toDepartment: string): any {
    const redacted = { ...data };
    // Minimization rule: only transfer what is needed
    if (toDepartment !== "MORTGAGE" && toDepartment !== "FINANCE") {
      delete redacted.bankDetails;
      delete redacted.preApprovalAmount;
      delete redacted.financialSituation;
    }
    return redactSensitiveData(redacted);
  }

  static redactForComparables(data: any): any {
    return redactForComparables(data);
  }
}
