import { PrismaClient, Prisma } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  await prisma.syriaAppUser.upsert({
    where: { email: "admin@syria.local" },
    create: {
      email: "admin@syria.local",
      name: "Syria Admin",
      role: "ADMIN",
    },
    update: {},
  });

  const host = await prisma.syriaAppUser.upsert({
    where: { email: "host@syria.local" },
    create: {
      email: "host@syria.local",
      name: "Demo Host",
      role: "HOST",
    },
    update: {},
  });

  const seedListings = [
    {
      titleAr: "فيلا بحديقة — دمشق",
      titleEn: "Garden villa — Damascus",
      descriptionAr: "شارع هادئ، فناء ظليل، كهرباء محدّثة.",
      descriptionEn: "Quiet residential street, shaded courtyard, updated wiring.",
      city: "Damascus",
      cityAr: "دمشق",
      cityEn: "Damascus",
      districtAr: null,
      districtEn: null,
      price: new Prisma.Decimal("920000000"),
      type: "SALE" as const,
      status: "PUBLISHED" as const,
      isFeatured: true,
      amenities: ["wifi", "furnished", "electricity_24h"],
    },
    {
      titleAr: "شقة مطلة على البحر — اللاذقية",
      descriptionAr: "وحدتان نوم، ركنية، إطلالة شروق.",
      /** Intentionally omit English title/description — tests EN → AR fallback in UI */
      titleEn: null,
      descriptionEn: null,
      city: "Latakia",
      cityAr: "اللاذقية",
      cityEn: "Latakia",
      districtAr: null,
      districtEn: null,
      price: new Prisma.Decimal("380000000"),
      type: "RENT" as const,
      status: "PUBLISHED" as const,
      isFeatured: false,
      amenities: ["Elevator", "Balcony"],
    },
    {
      titleAr: "إقامة BNHub — غرفة في البلدة القديمة",
      titleEn: "BNHub stay — Old City loft",
      descriptionAr: "إقامات قصيرة في الحي التاريخي. تسوية يدوية للضيف.",
      descriptionEn: "Short stays in the historic quarter. Manual guest settlement.",
      city: "Aleppo",
      cityAr: "حلب",
      cityEn: "Aleppo",
      districtAr: null,
      districtEn: null,
      price: new Prisma.Decimal("750000"),
      type: "BNHUB" as const,
      status: "PUBLISHED" as const,
      isFeatured: false,
      amenities: ["wifi", "hot_water_24h", "furnished"],
    },
  ];

  const existingProps = await prisma.syriaProperty.count();
  if (existingProps === 0) {
    for (const row of seedListings) {
      await prisma.syriaProperty.create({
        data: {
          titleAr: row.titleAr,
          titleEn: row.titleEn,
          descriptionAr: row.descriptionAr,
          descriptionEn: row.descriptionEn,
          city: row.city,
          cityAr: row.cityAr,
          cityEn: row.cityEn,
          districtAr: row.districtAr,
          districtEn: row.districtEn,
          price: row.price,
          currency: "SYP",
          type: row.type,
          images: [],
          amenities: row.amenities,
          ownerId: host.id,
          status: row.status,
          isFeatured: row.isFeatured,
          featuredUntil: row.isFeatured ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
  }

  console.info("[syria seed] users ready; sample listings skipped if DB already had properties", {
    admin: "admin@syria.local",
    host: host.email,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
