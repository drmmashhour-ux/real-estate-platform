export type CorrectiveActionPlan = {
  capaId: string;
  complaintId: string;

  rootCauseSummary: string;
  correctiveActions: string[];
  preventiveActions: string[];
  ownerUserId: string;
  dueDate?: string | null;
  completed: boolean;
  completedAt?: string | null;
};
