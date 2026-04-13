import { prisma } from "@/lib/db";
import { OACIQ_PROMISE_SAMPLE_KEY, oaciqPromiseSampleSchema } from "./schemas/oaciq-promise-sample";

export async function ensureDefaultLegalFormTemplates() {
  await prisma.legalFormTemplate.upsert({
    where: { key: OACIQ_PROMISE_SAMPLE_KEY },
    create: {
      key: OACIQ_PROMISE_SAMPLE_KEY,
      name: "Promise to purchase (sample structure)",
      language: "fr",
      version: "1.0.0",
      schemaJson: oaciqPromiseSampleSchema as object,
      isActive: true,
    },
    update: {
      schemaJson: oaciqPromiseSampleSchema as object,
      isActive: true,
    },
  });
}
