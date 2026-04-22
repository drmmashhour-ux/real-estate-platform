import { notFound } from "next/navigation";

import {
  SoinsResidenceDetailClient,
  type ResidenceDetailVm,
} from "@/components/soins/SoinsResidenceDetailClient";
import { getCareResidence } from "@/modules/soins/soins-residence.service";

export const dynamic = "force-dynamic";

export default async function SoinsResidenceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; residenceId: string }>;
}) {
  const { residenceId } = await params;
  const r = await getCareResidence(residenceId);
  if (!r) notFound();

  const vm: ResidenceDetailVm = {
    id: r.id,
    title: r.title,
    city: r.city,
    address: r.address,
    type: r.type,
    basePrice: r.basePrice,
    description: r.description,
    units: r.units.map((u) => ({
      id: u.id,
      title: u.title,
      price: u.price,
      roomType: u.roomType,
      availability: u.availability,
    })),
    services: r.services.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      price: s.price,
      requiredLevel: s.requiredLevel,
    })),
    foodPlans: r.foodPlans.map((f) => ({
      id: f.id,
      name: f.name,
      mealsPerDay: f.mealsPerDay,
      price: f.price,
    })),
  };

  return <SoinsResidenceDetailClient vm={vm} />;
}
