export type ExecutionDay = {
  day: number;
  title: string;
  tasks: string[];
};

export type ExecutionPlan = {
  id: string;
  days: ExecutionDay[];
  createdAt: string;
};
