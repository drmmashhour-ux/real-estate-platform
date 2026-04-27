/**
 * G2 sprint: 25 demo listings (realistic Syrian cities + SYP prices).
 * Idempotent: removes prior rows with title starting "[G2]" then recreates.
 *
 *   cd apps/syria && pnpm exec tsx scripts/seed-g2-sprint-listings.ts
 */
import { PrismaClient, Prisma } from "../src/generated/prisma";
import { allocateAdCodeInTransaction } from "../src/lib/syria/ad-code";

const prisma = new PrismaClient();

const ownerEmail = "g2-sprint@syria.local";
const phone = "963944000001";

type Row = {
  titleAr: string;
  state: string;
  governorate: string;
  city: string;
  cityAr: string;
  area: string | null;
  price: string;
  type: "SALE" | "RENT";
  descriptionAr: string;
  amenities: string[];
};

const rows: Row[] = [
  { titleAr: "[G2] شقة ١١٠م — المزة", state: "Damascus", governorate: "Damascus", city: "Damascus", cityAr: "دمشق", area: "المزة", price: "485000000", type: "SALE", descriptionAr: "طابق متوسط، كهرباء قديم+جديد، قريب من المدارس.", amenities: ["wifi", "furnished", "electricity_24h"] },
  { titleAr: "[G2] بيت عربي — باب توما", state: "Damascus", governorate: "Damascus", city: "Damascus", cityAr: "دمشق", area: "باب توما", price: "1200000000", type: "SALE", descriptionAr: "يحتاج ترميم، موقع مميز داخل الأسوار.", amenities: [] },
  { titleAr: "[G2] شقة سكني — دمر", state: "Damascus", governorate: "Damascus", city: "Damascus", cityAr: "دمشق", area: "دمر", price: "320000000", type: "RENT", descriptionAr: "سنوي، دفعات مرنة — التفاصيل عبر الهاتف.", amenities: ["city_center", "near_market"] },
  { titleAr: "[G2] فيلا — دوما", state: "Rif Dimashq", governorate: "Rif Dimashq", city: "Douma", cityAr: "دوما", area: "مركز المدينة", price: "2400000000", type: "SALE", descriptionAr: "حديقة، جراج، عدة غرف نوم.", amenities: ["furnished", "wifi", "hot_water_24h"] },
  { titleAr: "[G2] شقة — جرمانا", state: "Rif Dimashq", governorate: "Rif Dimashq", city: "Jaramana", cityAr: "جرمانا", area: null, price: "175000000", type: "SALE", descriptionAr: "واجهة، طابق أول.", amenities: ["air_conditioning"] },
  { titleAr: "[G2] شقة — داريا", state: "Rif Dimashq", governorate: "Rif Dimashq", city: "Darayya", cityAr: "داريا", area: "داريا البلد", price: "890000000", type: "SALE", descriptionAr: "مساحة جيدة، شارع واسع.", amenities: [] },
  { titleAr: "[G2] شقة — ساحة السبع بحرات", state: "Aleppo", governorate: "Aleppo", city: "Aleppo", cityAr: "حلب", area: "السبع بحرات", price: "410000000", type: "SALE", descriptionAr: "مطلّة داخلية، هادئ.", amenities: ["wifi", "furnished"] },
  { titleAr: "[G2] محل — الجميلية", state: "Aleppo", governorate: "Aleppo", city: "Aleppo", cityAr: "حلب", area: "الجميلية", price: "280000000", type: "SALE", descriptionAr: "واجهة زجاج، مناسب تجزئة.", amenities: [] },
  { titleAr: "[G2] بيت — الشيخ مقصود", state: "Aleppo", governorate: "Aleppo", city: "Aleppo", cityAr: "حلب", area: "الشيخ مقصود", price: "195000000", type: "RENT", descriptionAr: "عائلي، دفعة كل ٦ شهور.", amenities: [] },
  { titleAr: "[G2] شقة — الحمدانية", state: "Aleppo", governorate: "Aleppo", city: "Aleppo", cityAr: "حلب", area: "الحمدانية", price: "360000000", type: "SALE", descriptionAr: "جديدة التشطيب، بناية جديدة.", amenities: ["wifi", "furnished", "electricity_24h"] },
  { titleAr: "[G2] شقة — الحميدية", state: "Homs", governorate: "Homs", city: "Homs", cityAr: "حمص", area: "الحميدية", price: "155000000", type: "SALE", descriptionAr: "قريب من الأسواق.", amenities: ["near_market"] },
  { titleAr: "[G2] مكتب — الوعر", state: "Homs", governorate: "Homs", city: "Homs", cityAr: "حمص", area: "الوعر", price: "125000000", type: "RENT", descriptionAr: "سنوي، كهرباء مولّدة.", amenities: [] },
  { titleAr: "[G2] بيت — باب عمرو", state: "Homs", governorate: "Homs", city: "Homs", cityAr: "حمص", area: "باب عمرو", price: "220000000", type: "SALE", descriptionAr: "يحتاج صيانة بسيطة.", amenities: [] },
  { titleAr: "[G2] شقة — حماة (وسط)", state: "Hama", governorate: "Hama", city: "Hama", cityAr: "حماة", area: "المدينة", price: "98000000", type: "SALE", descriptionAr: "طابق ثالث.", amenities: [] },
  { titleAr: "[G2] مزرعة — ريف حماة", state: "Hama", governorate: "Hama", city: "Hama", cityAr: "حماة", area: "القصور", price: "1500000000", type: "SALE", descriptionAr: "بئر ماء، مبنى تخزين.", amenities: [] },
  { titleAr: "[G2] شقة — الرمل (اللاذقية)", state: "Latakia", governorate: "Latakia", city: "Latakia", cityAr: "اللاذقية", area: "الرمل", price: "520000000", type: "SALE", descriptionAr: "قريب من البحر (إطلالة بعيدة).", amenities: ["wifi", "furnished", "hot_water_24h"] },
  { titleAr: "[G2] شقة — الصليبة", state: "Latakia", governorate: "Latakia", city: "Latakia", cityAr: "اللاذقية", area: "الصليبة", price: "275000000", type: "RENT", descriptionAr: "مفروش — موسمي أو سنوي.", amenities: ["furnished", "wifi", "hot_water_24h"] },
  { titleAr: "[G2] بيت — المشروع السابع", state: "Latakia", governorate: "Latakia", city: "Latakia", cityAr: "اللاذقية", area: "المشروع السابع", price: "680000000", type: "SALE", descriptionAr: "حي هادئ، مناسب عائلة.", amenities: [] },
  { titleAr: "[G2] شقة — الشيخ سعد", state: "Tartus", governorate: "Tartus", city: "Tartus", cityAr: "طرطوس", area: "الشيخ سعد", price: "185000000", type: "SALE", descriptionAr: "قريب من البحر.", amenities: ["city_center", "furnished"] },
  { titleAr: "[G2] شقة — طرطوس المدينة", state: "Tartus", governorate: "Tartus", city: "Tartus", cityAr: "طرطوس", area: "المدينة", price: "210000000", type: "SALE", descriptionAr: "قرب المينا والأسواق.", amenities: [] },
  { titleAr: "[G2] شقة — إدلب المدينة", state: "Idlib", governorate: "Idlib", city: "Idlib", cityAr: "إدلب", area: null, price: "140000000", type: "SALE", descriptionAr: "سوق قريب، وصول سهل.", amenities: [] },
  { titleAr: "[G2] أرض — درعا البلد", state: "Daraa", governorate: "Daraa", city: "Daraa", cityAr: "درعا", area: "درعا البلد", price: "750000000", type: "SALE", descriptionAr: "زاوية، شارعين.", amenities: [] },
  { titleAr: "[G2] شقة — دير الزور", state: "Deir ez-Zor", governorate: "Deir ez-Zor", city: "Deir ez-Zor", cityAr: "دير الزور", area: "المدينة", price: "115000000", type: "RENT", descriptionAr: "تأجير سنوي.", amenities: [] },
  { titleAr: "[G2] بيت — الرقة", state: "Raqqa", governorate: "Raqqa", city: "Raqqa", cityAr: "الرقة", area: "مركز المدينة", price: "165000000", type: "SALE", descriptionAr: "مركز المدينة.", amenities: [] },
  { titleAr: "[G2] شقة — الحسكة", state: "Al-Hasakah", governorate: "Al-Hasakah", city: "Al-Hasakah", cityAr: "الحسكة", area: "مركز المدينة", price: "125000000", type: "SALE", descriptionAr: "هادئ، عائلي.", amenities: ["furnished", "wifi"] },
];

async function main() {
  const owner = await prisma.syriaAppUser.upsert({
    where: { email: ownerEmail },
    create: { email: ownerEmail, name: "G2 sprint demo", phone: phone.replace(/\D/g, "") },
    update: { phone: phone.replace(/\D/g, ""), name: "G2 sprint demo" },
  });

  const del = await prisma.syriaProperty.deleteMany({
    where: { titleAr: { startsWith: "[G2]" } },
  });

  for (const r of rows) {
    await prisma.$transaction(async (tx) => {
      const adCode = await allocateAdCodeInTransaction(tx, "real_estate");
      await tx.syriaProperty.create({
        data: {
          adCode,
          titleAr: r.titleAr,
          titleEn: null,
          descriptionAr: r.descriptionAr,
          descriptionEn: null,
          state: r.state,
          governorate: r.governorate,
          city: r.city,
          cityAr: r.cityAr,
          cityEn: r.city,
          area: r.area,
          districtAr: r.area,
          districtEn: null,
          placeName: null,
          addressText: null,
          addressDetails: null,
          latitude: null,
          longitude: null,
          price: new Prisma.Decimal(r.price),
          currency: "SYP",
          type: r.type,
          images: [],
          amenities: r.amenities,
          ownerId: owner.id,
          status: "PUBLISHED",
          plan: "free",
          fraudFlag: false,
          listingVerified: false,
          verified: false,
          isFeatured: false,
          featuredUntil: null,
          featuredPriority: 0,
          neighborhood: r.area,
        },
      });
    });
  }

  console.info(`[g2-sprint] removed ${del.count} old [G2] rows; created ${rows.length} listings for ${owner.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
