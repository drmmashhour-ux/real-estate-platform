import { prisma } from "@/lib/db";

export async function upsertTenantBrand(input: {
  tenantId: string;
  displayName: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  customCss?: string | null;
  customSettings?: unknown;
}) {
  return prisma.tenantBrand.upsert({
    where: { tenantId: input.tenantId },
    update: {
      displayName: input.displayName,
      logoUrl: input.logoUrl ?? undefined,
      faviconUrl: input.faviconUrl ?? undefined,
      primaryColor: input.primaryColor ?? undefined,
      secondaryColor: input.secondaryColor ?? undefined,
      accentColor: input.accentColor ?? undefined,
      heroTitle: input.heroTitle ?? undefined,
      heroSubtitle: input.heroSubtitle ?? undefined,
      customCss: input.customCss ?? undefined,
      customSettings: input.customSettings === undefined ? undefined : (input.customSettings as object | null),
    },
    create: {
      tenantId: input.tenantId,
      displayName: input.displayName,
      logoUrl: input.logoUrl ?? null,
      faviconUrl: input.faviconUrl ?? null,
      primaryColor: input.primaryColor ?? "#D4AF37",
      secondaryColor: input.secondaryColor ?? "#000000",
      accentColor: input.accentColor ?? "#ffffff",
      heroTitle: input.heroTitle ?? null,
      heroSubtitle: input.heroSubtitle ?? null,
      customCss: input.customCss ?? null,
      customSettings: input.customSettings === undefined ? undefined : (input.customSettings as object | null),
    },
  });
}
