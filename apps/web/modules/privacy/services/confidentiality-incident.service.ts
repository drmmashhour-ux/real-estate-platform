import { prisma } from "@/lib/db";
import { ConfidentialityIncidentCategory, ConfidentialityIncidentRiskLevel } from "@prisma/client";

export class ConfidentialityIncidentService {
  /**
   * Registers a new confidentiality incident.
   */
  static async registerIncident(args: {
    organizationId?: string;
    transactionId?: string;
    category: ConfidentialityIncidentCategory;
    description: string;
    personalInfoTypes: string[];
    discoveredAt: Date;
    riskLevel: ConfidentialityIncidentRiskLevel;
    riskOfSeriousInjury: boolean;
    actionsTaken?: any;
    reportedBy: string;
  }) {
    const incident = await prisma.confidentialityIncident.create({
      data: {
        organizationId: args.organizationId,
        transactionId: args.transactionId,
        category: args.category,
        description: args.description,
        personalInfoTypes: args.personalInfoTypes,
        discoveredAt: args.discoveredAt,
        riskLevel: args.riskLevel,
        riskOfSeriousInjury: args.riskOfSeriousInjury,
        actionsTaken: args.actionsTaken ?? {},
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: args.reportedBy,
        action: "INCIDENT_REGISTERED",
        entityType: "ConfidentialityIncident",
        entityId: incident.id,
        purpose: "COMPLIANCE",
        metadata: {
          category: args.category,
          riskOfSeriousInjury: args.riskOfSeriousInjury,
        },
      },
    });

    // If risk of serious injury, trigger alerts (e.g. email Privacy Officer)
    if (args.riskOfSeriousInjury) {
      console.warn("CRITICAL PRIVACY INCIDENT: Risk of serious injury detected. Notifying Privacy Officer.");
      // TODO: Implement actual notification logic (e.g. Resend)
    }

    return incident;
  }
}
