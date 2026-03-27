import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ToolLeadType =
  | "investor_lead"
  | "first_home_buyer_lead"
  | "welcome_tax_lead"
  | "municipality_tax_lead"
  | "investor_portfolio_lead";

export type CreateToolLeadInput = {
  leadType: ToolLeadType;
  name?: string;
  email: string;
  phone?: string;
  /** Structured payload stored in message + mortgageInquiry */
  toolInputs: Record<string, unknown>;
  toolOutputs?: Record<string, unknown>;
  city?: string | null;
};

export async function createToolLead(input: CreateToolLeadInput) {
  const message = JSON.stringify({
    toolLead: input.leadType,
    inputs: input.toolInputs,
    outputs: input.toolOutputs ?? {},
    capturedAt: new Date().toISOString(),
  }).slice(0, 12000);

  const mortgageInquiry = {
    toolLead: input.leadType,
    inputs: input.toolInputs,
    outputs: input.toolOutputs ?? {},
  };

  return prisma.lead.create({
    data: {
      name: (input.name?.trim() || "Tool inquiry").slice(0, 200),
      email: input.email.trim().slice(0, 320),
      phone: (input.phone?.trim() || "—").slice(0, 64),
      message,
      status: "new",
      score: 52,
      leadSource: input.leadType,
      leadType: "tool",
      mortgageInquiry: mortgageInquiry as Prisma.InputJsonValue,
      purchaseRegion: input.city?.trim() || null,
      estimatedValue: (() => {
        const fromPurchase =
          typeof input.toolInputs.purchasePrice === "number"
            ? Math.round(input.toolInputs.purchasePrice)
            : typeof input.toolInputs.purchasePrice === "string"
              ? Math.round(Number(input.toolInputs.purchasePrice)) || null
              : null;
        if (fromPurchase != null) return fromPurchase;
        const fromAssessed =
          typeof input.toolInputs.assessedValue === "number"
            ? Math.round(input.toolInputs.assessedValue)
            : typeof input.toolInputs.assessedValue === "string"
              ? Math.round(Number(input.toolInputs.assessedValue)) || null
              : null;
        return fromAssessed;
      })(),
    },
  });
}
