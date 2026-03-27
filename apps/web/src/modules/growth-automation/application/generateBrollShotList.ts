import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";

export type BrollShot = { shot: string; lens?: string; notes?: string };

export async function generateBrollShotList(args: { topic: string; setting: "office" | "home" | "street" }) {
  const res = await growthAutomationJsonCompletion<{ shots: BrollShot[] }>({
    system: "B-roll shot list JSON for a simple product video. No unsafe activities.",
    user: JSON.stringify(args),
    label: "broll",
  });
  if (!res.ok) {
    return {
      shots: [
        { shot: "Hands on keyboard — CRM blur", notes: "2s" },
        { shot: "Wide office — natural light", notes: "3s" },
      ],
    };
  }
  return res.data;
}
