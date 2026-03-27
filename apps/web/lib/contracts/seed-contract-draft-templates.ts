import { prisma } from "@/lib/db";
import { DEFAULT_CONTRACT_TEMPLATES } from "@/modules/contracts/templates";

/** Idempotent: insert default rows when table is empty. */
export async function seedContractDraftTemplatesIfEmpty(): Promise<{ created: number }> {
  const count = await prisma.contractDraftTemplate.count();
  if (count > 0) return { created: 0 };

  let created = 0;
  for (let i = 0; i < DEFAULT_CONTRACT_TEMPLATES.length; i++) {
    const t = DEFAULT_CONTRACT_TEMPLATES[i];
    const slug = t.contractType.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.contractDraftTemplate.create({
      data: {
        slug: `${slug}-default`,
        name: t.name,
        contractType: t.contractType,
        definition: t.definition as object,
        sortOrder: i,
        isActive: true,
      },
    });
    created++;
  }
  return { created };
}
