export type CityDominationDay = {
  day: number;
  focus: string;
  actions: string[];
};

export type CityDominationPlan = {
  city: string;
  days: CityDominationDay[];
};
