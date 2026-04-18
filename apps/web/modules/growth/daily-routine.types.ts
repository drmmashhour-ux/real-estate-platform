export type DailyRoutineBlock = {
  time: string;
  focus: string;
  actions: string[];
};

export type DailyRoutine = {
  day: number;
  blocks: DailyRoutineBlock[];
};
