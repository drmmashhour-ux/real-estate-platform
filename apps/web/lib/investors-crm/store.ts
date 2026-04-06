import { promises as fs } from "node:fs";
import path from "node:path";

export const INVESTOR_CRM_STATUSES = [
  "not contacted",
  "contacted",
  "replied",
  "meeting",
  "closed",
  "no response",
] as const;

export type InvestorCrmStatus = (typeof INVESTOR_CRM_STATUSES)[number];

export type InvestorCrmRecord = {
  id: string;
  name: string;
  fund_name: string;
  type: string;
  focus: string;
  stage: string;
  location: string;
  email: string;
  linkedin: string;
  source: string;
  status: InvestorCrmStatus;
  last_contact_date: string;
  next_follow_up: string;
  notes: string;
};

function dataPath() {
  return path.join(process.cwd(), "data", "investors-crm.json");
}

function isStatus(s: string): s is InvestorCrmStatus {
  return (INVESTOR_CRM_STATUSES as readonly string[]).includes(s);
}

export async function readInvestorsCrm(): Promise<InvestorCrmRecord[]> {
  const raw = await fs.readFile(dataPath(), "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  const out: InvestorCrmRecord[] = [];
  for (const row of parsed) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : "";
    if (!id) continue;
    const statusRaw = typeof r.status === "string" ? r.status : "not contacted";
    const status: InvestorCrmStatus = isStatus(statusRaw) ? statusRaw : "not contacted";
    out.push({
      id,
      name: typeof r.name === "string" ? r.name : "",
      fund_name: typeof r.fund_name === "string" ? r.fund_name : "",
      type: typeof r.type === "string" ? r.type : "",
      focus: typeof r.focus === "string" ? r.focus : "",
      stage: typeof r.stage === "string" ? r.stage : "",
      location: typeof r.location === "string" ? r.location : "",
      email: typeof r.email === "string" ? r.email : "",
      linkedin: typeof r.linkedin === "string" ? r.linkedin : "",
      source: typeof r.source === "string" ? r.source : "",
      status,
      last_contact_date: typeof r.last_contact_date === "string" ? r.last_contact_date : "",
      next_follow_up: typeof r.next_follow_up === "string" ? r.next_follow_up : "",
      notes: typeof r.notes === "string" ? r.notes : "",
    });
  }
  return out;
}

export async function writeInvestorsCrm(rows: InvestorCrmRecord[]): Promise<void> {
  await fs.writeFile(dataPath(), `${JSON.stringify(rows, null, 2)}\n`, "utf8");
}
