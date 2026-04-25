/** CAD — illustrative; adjust in payroll / finance policy. */
export const BONUS_PER_DEMO_CAD = 40;
export const BONUS_PER_ACTIVATION_CAD = 200;

export const FIELD_TEAM_DAILY_TARGETS = {
  brokerContacts: 10,
  demos: 3,
  followUps: 3,
} as const;

export const INTERVIEW_QUESTIONS = [
  {
    id: "q1",
    text: "Explain something simply to me in 30 seconds.",
  },
  {
    id: "q2",
    text: "Convince me to try something new.",
  },
  {
    id: "q3",
    text: "How would you react if someone says they don’t have time?",
  },
  {
    id: "q4",
    text: "Can you follow a script exactly?",
  },
  {
    id: "q5",
    text: "Are you comfortable speaking with professionals?",
  },
] as const;

export type InterviewRubric = {
  clarity: number;
  confidence: number;
  listening: number;
  discipline: number;
};

export const EMPTY_RUBRIC: InterviewRubric = {
  clarity: 3,
  confidence: 3,
  listening: 3,
  discipline: 3,
};

export function parseInterviewScores(raw: unknown): InterviewRubric | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const n = (k: string) => (typeof o[k] === "number" ? (o[k] as number) : NaN);
  const clarity = n("clarity");
  const confidence = n("confidence");
  const listening = n("listening");
  const discipline = n("discipline");
  if ([clarity, confidence, listening, discipline].some((x) => !Number.isFinite(x))) return null;
  return { clarity, confidence, listening, discipline };
}
