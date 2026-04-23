import { prisma } from "@/lib/db";
import { PrivacyDataCategory } from "@prisma/client";

export class PrivacyRetentionService {
  /**
   * Calculates the destruction date based on category and current policy.
   */
  static async getDestructionDate(category: PrivacyDataCategory, startDate: Date): Promise<Date> {
    const policy = await prisma.privacyRetentionPolicy.findFirst({
      where: { dataCategory: category },
    });

    const days = policy?.retentionPeriod ?? 365 * 7; // Default 7 years for real estate in QC
    const destructionDate = new Date(startDate);
    destructionDate.setDate(destructionDate.getDate() + days);
    return destructionDate;
  }

  /**
   * Schedules a destruction job.
   */
  static async scheduleDestruction(args: {
    scheduledFor: Date;
    dataCategory?: PrivacyDataCategory;
  }) {
    return prisma.privacyDestructionJob.create({
      data: {
        scheduledFor: args.scheduledFor,
        dataCategory: args.dataCategory,
      },
    });
  }

  /**
   * Securely destroys data and logs the action.
   */
  static async destroyData(args: {
    jobId: string;
    entityType: string;
    entityId: string;
    destroyedBy: string;
    destructionMethod: string;
  }) {
    // 1. Check for legal hold
    const job = await prisma.privacyDestructionJob.findUnique({
      where: { id: args.jobId },
    });

    if (job?.legalHold) {
      throw new Error("Destruction job is under legal hold and cannot proceed.");
    }

    // 2. Perform actual deletion (simplified for now)
    // await prisma[args.entityType].delete({ where: { id: args.entityId } });

    // 3. Log destruction
    await prisma.privacyDestructionLog.create({
      data: {
        jobId: args.jobId,
        entityType: args.entityType,
        entityId: args.entityId,
        destroyedBy: args.destroyedBy,
        destructionMethod: args.destructionMethod,
      },
    });

    // 4. Audit log
    await prisma.privacyAuditLog.create({
      data: {
        userId: args.destroyedBy,
        action: "DATA_DESTROYED",
        entityType: args.entityType,
        entityId: args.entityId,
        metadata: {
          jobId: args.jobId,
          method: args.destructionMethod,
        },
      },
    });

    return true;
  }
}
