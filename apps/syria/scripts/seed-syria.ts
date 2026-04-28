/**
 * ORDER SYBNB-109 — Auto seed realistic Syria listings with Unsplash CDN photos (HTTPS).
 * Idempotent: deletes rows whose Arabic title starts with `[Seed]` then inserts fresh data.
 *
 * From `apps/syria` (recommended):
 *   pnpm seed:syria
 *
 * Alternative (same logic; CommonJS compile — avoids `.ts` loader errors):
 *   pnpm seed:syria:ts-node
 *
 * Equivalent raw tsx:
 *   pnpm exec tsx scripts/seed-syria.ts
 *
 * Requires `DATABASE_URL` (and optional `.env.local`). Never commit secrets.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { PrismaClient, Prisma, SyriaSybnbListingReview } from "../src/generated/prisma";
import { allocateAdCodeInTransaction } from "../src/lib/syria/ad-code";
import { SYRIA_AMENITIES } from "../src/lib/syria/amenities";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

const TITLE_PREFIX = "[Seed]";
const OWNER_EMAIL = "seed-syria@syria.local";
const OWNER_PHONE = "963945109001";

/** Curated Unsplash `images.unsplash.com` URLs (interiors, hotels, objects). Safe HTTPS hotlinks. */
const IMAGES_STAY = [
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
  "https://images.unsplash.com/photo-1522708323830-79152067f92f?w=1200&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
  "https://images.unsplash.com/photo-1631049307264-e00cd4a2bdb6?w=1200&q=80",
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&q=80",
];

const IMAGES_HOTEL = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80",
  "https://images.unsplash.com/photo-1568084680786-a84f91d1153e?w=1200&q=80",
  "https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=1200&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3e461?w=1200&q=80",
];

const IMAGES_OBJECT = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
];

const IMAGES_REALTY = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
];

type Loc = {
  state: string;
  governorate: string;
  city: string;
  cityAr: string;
  area: string | null;
  lat: number;
  lng: number;
};

const LOCATIONS: Loc[] = [
  { state: "Damascus", governorate: "Damascus", city: "Damascus", cityAr: "دمشق", area: "المزة", lat: 33.5138, lng: 36.2765 },
  { state: "Damascus", governorate: "Damascus", city: "Damascus", cityAr: "دمشق", area: "أبو رمانة", lat: 33.5132, lng: 36.2919 },
  { state: "Rif Dimashq", governorate: "Rif Dimashq", city: "Jaramana", cityAr: "جرمانا", area: null, lat: 33.4878, lng: 36.3549 },
  { state: "Aleppo", governorate: "Aleppo", city: "Aleppo", cityAr: "حلب", area: "الجميلية", lat: 36.2021, lng: 37.1343 },
  { state: "Aleppo", governorate: "Aleppo", city: "Aleppo", cityAr: "حلب", area: "السبع بحرات", lat: 36.2156, lng: 37.1592 },
  { state: "Latakia", governorate: "Latakia", city: "Latakia", cityAr: "اللاذقية", area: "الرمل", lat: 35.5178, lng: 35.7834 },
  { state: "Tartus", governorate: "Tartus", city: "Tartus", cityAr: "طرطوس", area: "المدينة", lat: 34.8938, lng: 35.8866 },
  { state: "Homs", governorate: "Homs", city: "Homs", cityAr: "حمص", area: "الحميدية", lat: 34.7324, lng: 36.7137 },
  { state: "Hama", governorate: "Hama", city: "Hama", cityAr: "حماة", area: "المدينة", lat: 35.1318, lng: 36.7578 },
  { state: "Idlib", governorate: "Idlib", city: "Idlib", cityAr: "إدلب", area: null, lat: 35.9318, lng: 36.6316 },
];

const HOTEL_NAMES_AR = [
  "الواحة الذهبية",
  "مركز الشام بلازا",
  "كورنيش اللاذقية",
  "فندق القلعة — حلب",
  "حدائق حمص",
  "طرطوس مارينا",
  "دار الضيافة — حماة",
  "البحر الأزرق",
  "إسكان الشاطئ",
];

const AMENITY_KEYS = SYRIA_AMENITIES.map((a) => a.key);

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

function pickAmenities(min: number, max: number): string[] {
  const n = randInt(min, max);
  return shuffle([...AMENITY_KEYS]).slice(0, n);
}

function pickImages(pool: string[], min: number, max: number): string[] {
  const n = Math.min(randInt(min, max), pool.length, 5);
  return shuffle([...pool]).slice(0, n);
}

function fmtMoney(n: bigint): string {
  return n.toString();
}

async function main() {
  const removed = await prisma.syriaProperty.deleteMany({
    where: { titleAr: { startsWith: TITLE_PREFIX } },
  });

  const verifiedAt = new Date();
  const owner = await prisma.syriaAppUser.upsert({
    where: { email: OWNER_EMAIL },
    create: {
      email: OWNER_EMAIL,
      name: "Seed Syria batch",
      phone: OWNER_PHONE.replace(/\D/g, ""),
      role: "HOST",
      phoneVerified: true,
      phoneVerifiedAt: verifiedAt,
      verifiedAt,
      verificationLevel: "phone",
    },
    update: {
      name: "Seed Syria batch",
      phone: OWNER_PHONE.replace(/\D/g, ""),
      phoneVerified: true,
      phoneVerifiedAt: verifiedAt,
      verifiedAt,
      verificationLevel: "phone",
    },
  });

  let created = 0;

  const demoMeta: Prisma.InputJsonValue = { source: "seed-syria", version: 1 };

  /** Stay apartments (SYBNB apartment nightly). */
  for (let i = 0; i < 14; i++) {
    const loc = LOCATIONS[i % LOCATIONS.length]!;
    const nightly = randInt(85_000, 480_000);
    const imgs = pickImages(IMAGES_STAY, 3, 5);
    const amen = pickAmenities(2, 4);
    const titleAr = `${TITLE_PREFIX} شقة مفروشة للإيجار اليومي — ${loc.area ?? loc.cityAr}`;
    const descriptionAr =
      `شقة واسعة في ${loc.cityAr}${loc.area ? `، حي ${loc.area}` : ""}. للإقامة القصيرة والعائلية الصغيرة. السعر التقريبي ${nightly.toLocaleString("ar-SY")} ليرة لليلة. تواصل عبر المنصة لمزيد من التفاصيل والتوفر.`;

    await prisma.$transaction(async (tx) => {
      const adCode = await allocateAdCodeInTransaction(tx, "stay");
      await tx.syriaProperty.create({
        data: {
          adCode,
          titleAr,
          titleEn: `Furnished apartment — ${loc.city}`,
          descriptionAr,
          descriptionEn: `Short-stay apartment in ${loc.city}. From ~${nightly.toLocaleString()} SYP/night.`,
          state: loc.state,
          governorate: loc.governorate,
          city: loc.city,
          cityAr: loc.cityAr,
          cityEn: loc.city,
          area: loc.area,
          districtAr: loc.area,
          districtEn: null,
          latitude: loc.lat + (Math.random() - 0.5) * 0.04,
          longitude: loc.lng + (Math.random() - 0.5) * 0.04,
          price: new Prisma.Decimal(String(nightly)),
          pricePerNight: nightly,
          currency: "SYP",
          type: "RENT",
          category: "stay",
          subcategory: "furnished",
          sybnbStayType: "apartment",
          sybnbReview: SyriaSybnbListingReview.APPROVED,
          images: imgs,
          amenities: amen,
          listingPhotoCount: imgs.length,
          ownerId: owner.id,
          status: "PUBLISHED",
          plan: "free",
          fraudFlag: false,
          needsReview: false,
          listingVerified: true,
          verified: true,
          isFeatured: i % 7 === 0,
          isDirect: true,
          guestsMax: randInt(2, 6),
          bedrooms: randInt(1, 3),
          bathrooms: randInt(1, 2),
          furnished: true,
          demoMeta,
          views: randInt(12, 420),
        },
      });
    });
    created += 1;
  }

  /** Private rooms (stay / room). */
  for (let i = 0; i < 9; i++) {
    const loc = LOCATIONS[(i + 3) % LOCATIONS.length]!;
    const nightly = randInt(45_000, 220_000);
    const imgs = pickImages(IMAGES_STAY, 3, 5);
    const amen = pickAmenities(2, 4);
    const titleAr = `${TITLE_PREFIX} غرفة خاصة مع حمّ مشترك — ${loc.cityAr}`;
    const descriptionAr =
      `غرفة نظيفة وهادئة في ${loc.cityAr}. مناسبة للطلاب أو المسافرين السريعين. السعر حوالي ${nightly.toLocaleString("ar-SY")} ليرة لليلة. الواي فاي والمرافق الأساسية متوفرة حسب الإعلان.`;

    await prisma.$transaction(async (tx) => {
      const adCode = await allocateAdCodeInTransaction(tx, "stay");
      await tx.syriaProperty.create({
        data: {
          adCode,
          titleAr,
          titleEn: `Private room — ${loc.city}`,
          descriptionAr,
          descriptionEn: `Private room stay in ${loc.city}. ~${nightly.toLocaleString()} SYP/night.`,
          state: loc.state,
          governorate: loc.governorate,
          city: loc.city,
          cityAr: loc.cityAr,
          cityEn: loc.city,
          area: loc.area,
          districtAr: loc.area,
          latitude: loc.lat + (Math.random() - 0.5) * 0.03,
          longitude: loc.lng + (Math.random() - 0.5) * 0.03,
          price: new Prisma.Decimal(String(nightly)),
          pricePerNight: nightly,
          currency: "SYP",
          type: "RENT",
          category: "stay",
          subcategory: "furnished",
          sybnbStayType: "room",
          sybnbReview: SyriaSybnbListingReview.APPROVED,
          images: imgs,
          amenities: amen,
          listingPhotoCount: imgs.length,
          ownerId: owner.id,
          status: "PUBLISHED",
          plan: "free",
          fraudFlag: false,
          needsReview: false,
          listingVerified: true,
          verified: true,
          isDirect: true,
          guestsMax: randInt(1, 2),
          bedrooms: 1,
          furnished: Math.random() > 0.35,
          demoMeta,
          views: randInt(5, 280),
        },
      });
    });
    created += 1;
  }

  /** Hotels (type HOTEL, nightly rate). */
  for (let i = 0; i < HOTEL_NAMES_AR.length; i++) {
    const loc = LOCATIONS[(i + 2) % LOCATIONS.length]!;
    const hotelAr = HOTEL_NAMES_AR[i]!;
    const nightly = randInt(180_000, 950_000);
    const imgs = pickImages(IMAGES_HOTEL, 4, 5);
    const amen = pickAmenities(3, 4);
    const titleAr = `${TITLE_PREFIX} ${hotelAr} — ${loc.cityAr}`;
    const descriptionAr =
      `فندق عملي في قلب ${loc.cityAr} مع استقبال ومعلومات سياحية. غرف متعددة، إفطار حسب التوفر. الأسعار من حوالي ${nightly.toLocaleString("ar-SY")} ليرة لليلة. الصور توضيحية من معرض مشابه عالمياً.`;

    await prisma.$transaction(async (tx) => {
      const adCode = await allocateAdCodeInTransaction(tx, "stay");
      await tx.syriaProperty.create({
        data: {
          adCode,
          titleAr,
          titleEn: `${hotelAr} — ${loc.city}`,
          descriptionAr,
          descriptionEn: `Hotel-style stay in ${loc.city}. From ~${nightly.toLocaleString()} SYP/night.`,
          state: loc.state,
          governorate: loc.governorate,
          city: loc.city,
          cityAr: loc.cityAr,
          cityEn: loc.city,
          area: loc.area,
          districtAr: loc.area,
          latitude: loc.lat,
          longitude: loc.lng,
          price: new Prisma.Decimal(String(nightly)),
          pricePerNight: nightly,
          currency: "SYP",
          type: "HOTEL",
          category: "stay",
          subcategory: "hotel",
          sybnbStayType: "hotel",
          hotelName: hotelAr,
          roomsAvailable: randInt(8, 48),
          receptionAvailable: true,
          contactPhone: OWNER_PHONE.replace(/\D/g, ""),
          sybnbReview: SyriaSybnbListingReview.APPROVED,
          images: imgs,
          amenities: amen,
          listingPhotoCount: imgs.length,
          ownerId: owner.id,
          status: "PUBLISHED",
          plan: i % 3 === 0 ? "hotel_featured" : i % 3 === 1 ? "featured" : "free",
          fraudFlag: false,
          needsReview: false,
          listingVerified: true,
          verified: true,
          isFeatured: i % 3 === 0,
          isDirect: true,
          guestsMax: randInt(2, 8),
          demoMeta,
          views: randInt(60, 900),
          sybnbBrowseTier: 3,
        },
      });
    });
    created += 1;
  }

  /** Electronics & appliances (marketplace “small items”). */
  const electronicsSpecs = [
    { sub: "mobile", titleAr: "جوال ذكي بحالة جيدة", desc: "هاتف مستعمل بحالة ممتازة، بطارية سليمة، مع شاحن أصلي أو بديل موثوق." },
    { sub: "laptop", titleAr: "لابتوب للعمل والدراسة", desc: "جهاز مناسب للتصفح والعمل الخفيف، يُفضّل المعاينة قبل الشراء." },
    { sub: "mobile", titleAr: "جوال اقتصادي — للبيع السريع", desc: "سعر مناسب للاستخدام اليومي، شاشة سليمة مع ضمان المعاينة." },
    { sub: "appliances", titleAr: "مكواة ومكنسة كهربائية", desc: "أدوات منزلية بحالة جيدة، البيع لدواعي السفر." },
    { sub: "laptop", titleAr: "كمبيوتر محمول خفيف", desc: "وزن خفيف؛ مناسب للطلاب؛ الرجاء التأكد من المواصفات عبر الرسائل." },
  ] as const;

  for (let i = 0; i < electronicsSpecs.length; i++) {
    const loc = LOCATIONS[i % LOCATIONS.length]!;
    const spec = electronicsSpecs[i]!;
    const priceVal = BigInt(randInt(450_000, 18_000_000));
    const imgs = pickImages(IMAGES_OBJECT, 3, 5);
    const amen = pickAmenities(2, 3);
    const titleAr = `${TITLE_PREFIX} ${spec.titleAr} — ${loc.cityAr}`;
    const descriptionAr = `${spec.desc} الموقع: ${loc.cityAr}. السعر قابل للتفاوض ضمن المعقول.`;

    await prisma.$transaction(async (tx) => {
      const adCode = await allocateAdCodeInTransaction(tx, "electronics");
      await tx.syriaProperty.create({
        data: {
          adCode,
          titleAr,
          titleEn: `${spec.titleAr} — ${loc.city}`,
          descriptionAr,
          descriptionEn: listingDescEnElectronics(spec.titleAr, loc.city, priceVal),
          state: loc.state,
          governorate: loc.governorate,
          city: loc.city,
          cityAr: loc.cityAr,
          cityEn: loc.city,
          area: loc.area,
          districtAr: loc.area,
          latitude: loc.lat,
          longitude: loc.lng,
          price: new Prisma.Decimal(fmtMoney(priceVal)),
          currency: "SYP",
          type: "SALE",
          category: "electronics",
          subcategory: spec.sub,
          sybnbReview: SyriaSybnbListingReview.PENDING,
          images: imgs,
          amenities: amen,
          listingPhotoCount: imgs.length,
          ownerId: owner.id,
          status: "PUBLISHED",
          plan: "free",
          fraudFlag: false,
          needsReview: false,
          listingVerified: false,
          verified: false,
          isDirect: true,
          postingKind: "basic_item",
          demoMeta,
          views: randInt(3, 190),
        },
      });
    });
    created += 1;
  }

  /** Furniture */
  const furnitureSpecs = [
    { sub: "used", titleAr: "كنبة ثلاثية مريحة", desc: "قماش نظيف، استعمال منزلي، التسليم حسب الاتفاق داخل المدينة." },
    { sub: "office", titleAr: "مكتب عمل مع درج تخزين", desc: "مكتب خشب متين، مناسب للمكتب المنزلي." },
    { sub: "sale", titleAr: "طاولة طعام مع ستة كراسي", desc: "طقم غرفة طعام بحالة جيدة؛ يُفضّل المعاينة." },
    { sub: "used", titleAr: "خزانة ملابس واسعة", desc: "أبواب سليمة، لون محايد؛ القياس تقريبي يُذكر عند الطلب." },
  ] as const;

  for (let i = 0; i < furnitureSpecs.length; i++) {
    const loc = LOCATIONS[(i + 4) % LOCATIONS.length]!;
    const spec = furnitureSpecs[i]!;
    const priceVal = BigInt(randInt(280_000, 9_500_000));
    const imgs = pickImages(IMAGES_OBJECT, 3, 5);
    const amen = pickAmenities(2, 3);
    const titleAr = `${TITLE_PREFIX} ${spec.titleAr} — ${loc.cityAr}`;
    const descriptionAr = `${spec.desc} الموقع: ${loc.cityAr}.`;

    await prisma.$transaction(async (tx) => {
      const adCode = await allocateAdCodeInTransaction(tx, "furniture");
      await tx.syriaProperty.create({
        data: {
          adCode,
          titleAr,
          titleEn: `${spec.titleAr} — ${loc.city}`,
          descriptionAr,
          descriptionEn: `Furniture listing in ${loc.city}. ~${priceVal.toLocaleString()} SYP.`,
          state: loc.state,
          governorate: loc.governorate,
          city: loc.city,
          cityAr: loc.cityAr,
          cityEn: loc.city,
          area: loc.area,
          districtAr: loc.area,
          latitude: loc.lat,
          longitude: loc.lng,
          price: new Prisma.Decimal(fmtMoney(priceVal)),
          currency: "SYP",
          type: "SALE",
          category: "furniture",
          subcategory: spec.sub,
          sybnbReview: SyriaSybnbListingReview.PENDING,
          images: imgs,
          amenities: amen,
          listingPhotoCount: imgs.length,
          ownerId: owner.id,
          status: "PUBLISHED",
          plan: "free",
          fraudFlag: false,
          needsReview: false,
          listingVerified: false,
          verified: false,
          isDirect: true,
          postingKind: "basic_item",
          demoMeta,
          views: randInt(2, 120),
        },
      });
    });
    created += 1;
  }

  /** Extra real-estate sale/rent variety */
  const extraRealty: {
    type: "SALE" | "RENT";
    sub: string;
    titleAr: string;
    desc: string;
    priceMin: number;
    priceMax: number;
  }[] = [
    {
      type: "SALE",
      sub: "sale",
      titleAr: "محل تجاري زاوية — موقع ممتاز",
      desc: "محل بمساحة مناسبة لتجزئة أو خدمات؛ يُفضّل الاطلاع على الوثائق محلياً.",
      priceMin: 120_000_000,
      priceMax: 980_000_000,
    },
    {
      type: "RENT",
      sub: "rent",
      titleAr: "مكتب للإيجار السنوي",
      desc: "مساحة عمل هادئة؛ كهرباء وماء؛ مناسب مهن حرة صغيرة.",
      priceMin: 18_000_000,
      priceMax: 85_000_000,
    },
    {
      type: "SALE",
      sub: "commercial",
      titleAr: "محجر صغير للبناء قرب الطريق",
      desc: "قطعة أرض صناعية/تخزين بحسب التصنيف المحلي؛ تأكد من التراخيص.",
      priceMin: 220_000_000,
      priceMax: 620_000_000,
    },
    {
      type: "SALE",
      sub: "sale",
      titleAr: "شقة للبيع — تشطيب سوبر ديلوكس",
      desc: "بيع عائلي؛ إطلالة جيدة؛ جاهزة للسكن أو الاستثمار طويل الأمد.",
      priceMin: 280_000_000,
      priceMax: 1_200_000_000,
    },
  ];

  for (let i = 0; i < extraRealty.length; i++) {
    const loc = LOCATIONS[(i + 5) % LOCATIONS.length]!;
    const row = extraRealty[i]!;
    const priceVal = BigInt(randInt(row.priceMin, row.priceMax));
    const imgs = pickImages(IMAGES_REALTY, 3, 5);
    const amen = pickAmenities(2, 4);
    const titleAr = `${TITLE_PREFIX} ${row.titleAr} — ${loc.cityAr}`;
    const descriptionAr = `${row.desc} المدينة: ${loc.cityAr}${loc.area ? `، ${loc.area}` : ""}.`;

    await prisma.$transaction(async (tx) => {
      const adCode = await allocateAdCodeInTransaction(tx, "real_estate");
      await tx.syriaProperty.create({
        data: {
          adCode,
          titleAr,
          titleEn: `${row.titleAr} — ${loc.city}`,
          descriptionAr,
          descriptionEn: `Real-estate listing in ${loc.city}. Price on request ~${priceVal.toLocaleString()} SYP.`,
          state: loc.state,
          governorate: loc.governorate,
          city: loc.city,
          cityAr: loc.cityAr,
          cityEn: loc.city,
          area: loc.area,
          districtAr: loc.area,
          latitude: loc.lat,
          longitude: loc.lng,
          price: new Prisma.Decimal(fmtMoney(priceVal)),
          currency: "SYP",
          type: row.type,
          category: "real_estate",
          subcategory: row.sub,
          sybnbReview: SyriaSybnbListingReview.PENDING,
          images: imgs,
          amenities: amen,
          listingPhotoCount: imgs.length,
          ownerId: owner.id,
          status: "PUBLISHED",
          plan: i === 1 ? "featured" : "free",
          fraudFlag: false,
          needsReview: false,
          listingVerified: i % 2 === 0,
          verified: i % 3 === 0,
          isFeatured: i === 1,
          isDirect: true,
          demoMeta,
          views: randInt(20, 520),
        },
      });
    });
    created += 1;
  }

  console.info(
    `[seed-syria] removed ${removed.count} prior ${TITLE_PREFIX} rows; created ${created} listings for ${owner.email}`,
  );
}

function listingDescEnElectronics(titleAr: string, city: string, price: bigint): string {
  return `${titleAr} — ${city}. Asking ~${price.toLocaleString()} SYP. Inspect in person.`;
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
