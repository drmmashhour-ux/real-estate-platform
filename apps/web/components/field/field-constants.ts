import type { FieldLead } from "./field-types";

/** Daily goals for field agents (internal playbook). */
export const FIELD_DAILY_GOALS = {
  brokerVisits: 5,
  demos: 3,
  followUps: 2,
} as const;

/** Starter rows so the dashboard isn’t empty on first open (editable / deletable). */
export const FIELD_SEED_LEADS: Omit<FieldLead, "updatedAt">[] = [
  {
    id: "seed-1",
    brokerName: "Courtier · Exemple A",
    phone: "+1 514 555 0101",
    location: "Montréal, QC",
    status: "to_visit",
  },
  {
    id: "seed-2",
    brokerName: "Courtier · Exemple B",
    phone: "+1 450 555 0102",
    location: "Laval, QC",
    status: "scheduled",
  },
  {
    id: "seed-3",
    brokerName: "Courtier · Exemple C",
    phone: "+1 418 555 0103",
    location: "Québec, QC",
    status: "to_visit",
  },
];
