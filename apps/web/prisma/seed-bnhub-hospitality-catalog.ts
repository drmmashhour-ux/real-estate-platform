import type { BnhubAddonServiceCategory } from "@prisma/client";
import { prisma } from "../lib/db";

type Row = {
  id: string;
  serviceCode: string;
  name: string;
  category: BnhubAddonServiceCategory;
  description: string;
  icon: string;
  isPremiumTier?: boolean;
  minListingTrustScore?: number | null;
};

const CATALOG: Row[] = [
  {
    id: "bnhub-svc-airport-pickup",
    serviceCode: "airport_pickup",
    name: "Airport pickup",
    category: "TRANSPORT",
    description: "Scheduled pickup from the airport to the listing.",
    icon: "car",
    minListingTrustScore: 40,
  },
  {
    id: "bnhub-svc-airport-dropoff",
    serviceCode: "airport_dropoff",
    name: "Airport drop-off",
    category: "TRANSPORT",
    description: "Return transfer to the airport after checkout.",
    icon: "car",
  },
  {
    id: "bnhub-svc-breakfast",
    serviceCode: "breakfast",
    name: "Breakfast",
    category: "FOOD",
    description: "Continental or host-style breakfast.",
    icon: "coffee",
  },
  {
    id: "bnhub-svc-meal-delivery",
    serviceCode: "meal_delivery",
    name: "Meal delivery coordination",
    category: "FOOD",
    description: "Host coordinates local meal delivery to the door.",
    icon: "utensils",
  },
  {
    id: "bnhub-svc-private-chef",
    serviceCode: "private_chef",
    name: "Private chef",
    category: "FOOD",
    description: "In-home chef experience (subject to kitchen suitability).",
    icon: "chef-hat",
    isPremiumTier: true,
    minListingTrustScore: 55,
  },
  {
    id: "bnhub-svc-daily-cleaning",
    serviceCode: "daily_cleaning",
    name: "Daily cleaning",
    category: "CLEANING",
    description: "Light daily tidy and refresh.",
    icon: "sparkles",
  },
  {
    id: "bnhub-svc-mid-stay-cleaning",
    serviceCode: "mid_stay_cleaning",
    name: "Mid-stay cleaning",
    category: "CLEANING",
    description: "Full clean during longer stays.",
    icon: "sparkles",
  },
  {
    id: "bnhub-svc-linen-change",
    serviceCode: "linen_change",
    name: "Linen change",
    category: "CLEANING",
    description: "Fresh sheets and towels on request.",
    icon: "bed",
  },
  {
    id: "bnhub-svc-luggage-storage",
    serviceCode: "luggage_storage",
    name: "Luggage storage",
    category: "CONVENIENCE",
    description: "Secure storage before check-in or after checkout.",
    icon: "briefcase",
  },
  {
    id: "bnhub-svc-laundry",
    serviceCode: "laundry_service",
    name: "Laundry service",
    category: "CONVENIENCE",
    description: "Wash / fold or dry-clean coordination.",
    icon: "shirt",
  },
  {
    id: "bnhub-svc-concierge",
    serviceCode: "concierge",
    name: "Concierge",
    category: "CONVENIENCE",
    description: "Reservations, tickets, and local recommendations.",
    icon: "concierge-bell",
    isPremiumTier: true,
  },
  {
    id: "bnhub-svc-room-decoration",
    serviceCode: "room_decoration",
    name: "Room decoration",
    category: "EXPERIENCE",
    description: "Celebration setup (balloons, flowers, etc.).",
    icon: "party-popper",
  },
  {
    id: "bnhub-svc-spa",
    serviceCode: "spa_service",
    name: "Spa service",
    category: "EXPERIENCE",
    description: "In-home or partner spa booking.",
    icon: "spa",
    isPremiumTier: true,
    minListingTrustScore: 50,
  },
  {
    id: "bnhub-svc-guided-tour",
    serviceCode: "guided_tour",
    name: "Guided tour",
    category: "EXPERIENCE",
    description: "Local host-led or partner walking / driving tour.",
    icon: "map",
    isPremiumTier: true,
  },
];

/**
 * Upserts global BNHUB hospitality catalog. Optionally seeds demo listing offers.
 */
export async function seedBnhubHospitalityCatalog(demoListingId?: string): Promise<void> {
  for (const row of CATALOG) {
    await prisma.bnhubService.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        serviceCode: row.serviceCode,
        name: row.name,
        category: row.category,
        description: row.description,
        icon: row.icon,
        isActive: true,
        isPremiumTier: row.isPremiumTier ?? false,
        minListingTrustScore: row.minListingTrustScore ?? null,
      },
      update: {
        serviceCode: row.serviceCode,
        name: row.name,
        category: row.category,
        description: row.description,
        icon: row.icon,
        isPremiumTier: row.isPremiumTier ?? false,
        minListingTrustScore: row.minListingTrustScore ?? null,
      },
    });
  }

  if (!demoListingId) return;

  const demoOffers: {
    serviceId: string;
    pricingType: "FIXED" | "PER_DAY" | "PER_GUEST" | "PER_BOOKING" | "FREE";
    priceCents: number;
  }[] = [
    { serviceId: "bnhub-svc-breakfast", pricingType: "PER_DAY", priceCents: 1500 },
    { serviceId: "bnhub-svc-daily-cleaning", pricingType: "PER_DAY", priceCents: 2500 },
    { serviceId: "bnhub-svc-airport-pickup", pricingType: "FIXED", priceCents: 4500 },
    { serviceId: "bnhub-svc-concierge", pricingType: "PER_BOOKING", priceCents: 3500 },
  ];

  for (const o of demoOffers) {
    await prisma.bnhubListingService.upsert({
      where: {
        listingId_serviceId: { listingId: demoListingId, serviceId: o.serviceId },
      },
      create: {
        listingId: demoListingId,
        serviceId: o.serviceId,
        isEnabled: true,
        pricingType: o.pricingType,
        priceCents: o.priceCents,
        currency: "USD",
        isIncluded: false,
        requiresApproval: false,
      },
      update: {
        isEnabled: true,
        pricingType: o.pricingType,
        priceCents: o.priceCents,
      },
    });
  }
}
