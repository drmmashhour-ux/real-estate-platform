import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function appendLeadTimelineEvent(
  leadId: string,
  eventType: string,
  payload?: Record<string, unknown>
): Promise<void> {
  await prisma.leadTimelineEvent.create({
    data: {
      leadId,
      eventType,
      payload: payload != null ? (payload as Prisma.InputJsonValue) : undefined,
    },
  });
}

/** Pull evaluation property + valuation from aiExplanation JSON. */
export function extractLeadCity(lead: { aiExplanation: unknown; message: string }): string {
  const snap = extractEvaluationSnapshot(lead.aiExplanation);
  if (snap?.city) return snap.city;
  const m = lead.message.match(/City:\s*(.+)/i);
  return m ? m[1].trim().split("\n")[0].trim() : "";
}

export function extractEvaluationSnapshot(aiExplanation: unknown): {
  city?: string;
  province?: string;
  address?: string;
  propertyType?: string;
  estimate?: number;
  minValue?: number;
  maxValue?: number;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  condition?: string | null;
} | null {
  if (!aiExplanation || typeof aiExplanation !== "object") return null;
  const o = aiExplanation as Record<string, unknown>;
  const prop = o.property as Record<string, unknown> | undefined;
  const valuation = o.valuation as Record<string, unknown> | undefined;
  if (!prop && !valuation) return null;
  return {
    city: typeof prop?.city === "string" ? prop.city : undefined,
    province: typeof prop?.province === "string" ? prop.province : undefined,
    address: typeof prop?.address === "string" ? prop.address : undefined,
    propertyType: typeof prop?.propertyType === "string" ? prop.propertyType : undefined,
    sqft: typeof prop?.surfaceSqft === "number" ? prop.surfaceSqft : undefined,
    bedrooms: typeof prop?.bedrooms === "number" ? prop.bedrooms : undefined,
    bathrooms: typeof prop?.bathrooms === "number" ? prop.bathrooms : undefined,
    condition: prop?.condition != null ? String(prop.condition) : null,
    estimate:
      typeof valuation?.estimatedValue === "number"
        ? valuation.estimatedValue
        : typeof valuation?.estimate === "number"
          ? valuation.estimate
          : undefined,
    minValue: typeof valuation?.rangeMin === "number" ? valuation.rangeMin : undefined,
    maxValue: typeof valuation?.rangeMax === "number" ? valuation.rangeMax : undefined,
  };
}
