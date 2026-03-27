"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { propertyCreateSchema } from "@/validators/property";
import { revalidatePath } from "next/cache";
import type { PropertyStatus, PropertyType } from "@prisma/client";

export async function createPropertyAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!["SELLER", "BROKER", "ADMIN"].includes(user.role)) {
    throw new Error("Forbidden");
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = propertyCreateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid input");
  }

  const d = parsed.data;
  await prisma.property.create({
    data: {
      title: d.title,
      description: d.description,
      price: d.price,
      city: d.city,
      address: d.address,
      propertyType: d.propertyType as PropertyType,
      bedrooms: d.bedrooms,
      bathrooms: d.bathrooms,
      areaSqm: d.areaSqm ?? null,
      status: (d.status ?? "DRAFT") as PropertyStatus,
      ownerId: user.id,
      brokerId: d.brokerId ?? null,
    },
  });

  revalidatePath("/properties");
  revalidatePath("/dashboard/properties");
}
