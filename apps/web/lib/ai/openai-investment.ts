import { openai, isOpenAiConfigured } from "./openai";
import { logError } from "@/lib/logger";

async function safeJson<T>(text: string): Promise<T | null> {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

async function callOpenAI(prompt: string) {
  if (!isOpenAiConfigured()) return null;
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Return only valid JSON. No markdown." },
        { role: "user", content: prompt },
      ],
    });
    return res.choices[0]?.message?.content ?? null;
  } catch (error) {
    logError("OpenAI investment call failed", error);
    return null;
  }
}

export async function analyzeProjectInvestment(project: unknown, units: unknown[] = []) {
  const prompt = `Analyze this real estate project and return JSON with keys expectedAppreciation, rentalYieldEstimate, riskLevel, bestUnitRecommendation, investmentScore, shortExplanation.\nProject: ${JSON.stringify(project)}\nUnits: ${JSON.stringify(units)}`;
  const content = await callOpenAI(prompt);
  if (!content) return null;
  return safeJson<Record<string, unknown>>(content);
}

export async function predictUnitValueAI(project: unknown, unit: unknown) {
  const prompt = `Predict this unit value and return JSON with keys currentValue, deliveryValue, oneYearValue, growthPercent, rentalYield, confidence.\nProject: ${JSON.stringify(project)}\nUnit: ${JSON.stringify(unit)}`;
  const content = await callOpenAI(prompt);
  if (!content) return null;
  return safeJson<Record<string, unknown>>(content);
}

export async function generateInvestorInsights(project: unknown) {
  const prompt = `Generate investor insights and return JSON with keys bestCity, bestDeliveryYear, riskToAvoid, strategy, summary.\nProject: ${JSON.stringify(project)}`;
  const content = await callOpenAI(prompt);
  if (!content) return null;
  return safeJson<Record<string, unknown>>(content);
}
