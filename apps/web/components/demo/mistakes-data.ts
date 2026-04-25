export type DealKillingMistake = {
  id: string;
  number: number;
  title: string;
  problems: string[];
  fixes: string[];
};

export const DEAL_KILLING_MISTAKES: DealKillingMistake[] = [
  {
    id: "talking-too-much",
    number: 1,
    title: "Talking too much",
    problems: ["broker loses interest"],
    fixes: ["ask questions", "let them talk"],
  },
  {
    id: "explaining-everything",
    number: 2,
    title: "Explaining everything",
    problems: ["overwhelms broker"],
    fixes: ["show, don’t explain", "demo quickly"],
  },
  {
    id: "selling-ai",
    number: 3,
    title: "Selling AI",
    problems: ["broker doesn’t care"],
    fixes: ["sell time saving", "sell fewer errors"],
  },
  {
    id: "no-next-step",
    number: 4,
    title: "No clear next step",
    problems: ["no conversion"],
    fixes: ['always ask: “On teste ça sur un vrai dossier ?”'],
  },
  {
    id: "ignore-objections",
    number: 5,
    title: "Not handling objections",
    problems: ["lost opportunity"],
    fixes: ["respond quickly", "stay confident"],
  },
  {
    id: "demo-too-long",
    number: 6,
    title: "Too long demo",
    problems: ["attention lost"],
    fixes: ["keep under 10 minutes"],
  },
];

export const BEFORE_CALL_CHECKLIST: string[] = [
  "keep it short",
  "demo fast",
  "show value",
  "ask for trial",
];
