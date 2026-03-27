/**
 * Seller Declaration (disclosure) for listings. Required before publish.
 * If seller declines, listing cannot be published.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  deriveLegacyTextFields,
  emptySellerDeclarationFormData,
  type SellerDeclarationFormData,
} from "@/lib/bnhub/seller-declaration-form-data";

export type SellerDisclosureRecord = {
  id: string;
  listingId: string;
  structuralIssues: string | null;
  waterDamage: string | null;
  renovations: string | null;
  defects: string | null;
  formData: unknown | null;
  completedAt: Date | null;
  declinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getSellerDisclosure(
  listingId: string
): Promise<SellerDisclosureRecord | null> {
  try {
    const d = await prisma.sellerDisclosure.findUnique({
      where: { listingId },
    });
    return d;
  } catch (e) {
    console.warn("[seller-disclosure] getSellerDisclosure failed:", e);
    return null;
  }
}

export async function upsertSellerDisclosure(data: {
  listingId: string;
  structuralIssues?: string | null;
  waterDamage?: string | null;
  renovations?: string | null;
  defects?: string | null;
  formData?: SellerDeclarationFormData | null;
  declined?: boolean;
}): Promise<SellerDisclosureRecord | null> {
  try {
    const {
      listingId,
      structuralIssues = null,
      waterDamage = null,
      renovations = null,
      defects = null,
      formData = null,
      declined = false,
    } = data;

    const existing = await prisma.sellerDisclosure.findUnique({
      where: { listingId },
    });

    if (declined) {
      const payload = {
        structuralIssues: null,
        waterDamage: null,
        renovations: null,
        defects: null,
        formData: Prisma.JsonNull,
        completedAt: null,
        declinedAt: new Date(),
      };
      if (existing) {
        return await prisma.sellerDisclosure.update({
          where: { listingId },
          data: payload,
        });
      }
      return await prisma.sellerDisclosure.create({
        data: { listingId, ...payload },
      });
    }

    const fd = formData ?? emptySellerDeclarationFormData();
    const legacy = deriveLegacyTextFields(fd);

    const payload = {
      structuralIssues: structuralIssues?.trim() || legacy.structuralIssues,
      waterDamage: waterDamage?.trim() || legacy.waterDamage,
      renovations: renovations?.trim() || legacy.renovations,
      defects: defects?.trim() || legacy.defects,
      formData: fd as object,
      completedAt: new Date(),
      declinedAt: null,
    };

    if (existing) {
      return await prisma.sellerDisclosure.update({
        where: { listingId },
        data: payload,
      });
    }
    return await prisma.sellerDisclosure.create({
      data: { listingId, ...payload },
    });
  } catch (e) {
    console.warn("[seller-disclosure] upsertSellerDisclosure failed:", e);
    return null;
  }
}

export { mergeFormDataFromRecord } from "@/lib/bnhub/seller-declaration-form-data";
