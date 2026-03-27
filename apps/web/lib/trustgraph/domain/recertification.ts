export type RecertificationStatusDto = {
  jobId: string;
  subjectType: string;
  subjectId: string;
  status: string;
  nextRunAt: string | null;
  lastResult: string | null;
};

export type RecertificationOutcome = "still_valid" | "needs_update" | "expired" | "high_risk";
