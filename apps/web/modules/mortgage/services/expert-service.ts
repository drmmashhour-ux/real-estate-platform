import { prisma } from "@/lib/db";

export {
  assignMortgageExpertForNewLead,
  pickAssignableMortgageExpertId,
  type MortgageLeadAssignResult,
} from "@/modules/mortgage/services/lead-assignment";

export async function getMortgageExpertForUserId(userId: string) {
  return prisma.mortgageExpert.findUnique({
    where: { userId },
    include: { expertSubscription: true, expertCredits: true, expertBilling: true },
  });
}
