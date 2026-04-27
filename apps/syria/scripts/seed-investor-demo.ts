/**
 * Sy-only investor demo seed — fake data, DEMO_ emails / titles. No real PII.
 *   cd apps/syria && DEMO_DATA_ENABLED=true pnpm exec tsx scripts/seed-investor-demo.ts
 *
 * Production guard: assertDemoWriteAllowed() — implemented in src/lib/sybnb/investor-demo-write-guard.ts (called below before any DB write).
 */
import { Prisma, PrismaClient } from "../src/generated/prisma";
import { allocateAdCodeInTransaction } from "../src/lib/syria/ad-code";
import { INVESTOR_DEMO_TITLE_PREFIX } from "../src/lib/sybnb/investor-demo";
import { assertDemoWriteAllowed } from "../src/lib/sybnb/investor-demo-write-guard";
import { INVESTOR_DEMO_META, resetInvestorDemoData } from "../src/lib/sybnb/investor-demo-reset";
import { computeSybnbQuote } from "../src/lib/sybnb/sybnb-quote";

const prisma = new PrismaClient();

const DEMO = {
  host: { email: "DEMO_investor_host@syria.local", name: "DEMO — Verified Host" },
  hostPaused: { email: "DEMO_investor_host_paused@syria.local", name: "DEMO — Paused Host" },
  guest: { email: "DEMO_investor_guest@syria.local", name: "DEMO — Guest" },
  admin: { email: "DEMO_investor_admin@syria.local", name: "DEMO — Admin" },
} as const;

const baseStay = (titleSuffix: string, review: "APPROVED" | "PENDING" | "REJECTED", status: "PUBLISHED" | "PENDING_REVIEW" | "REJECTED") => ({
  titleAr: `${INVESTOR_DEMO_TITLE_PREFIX} ${titleSuffix}`,
  descriptionAr: "عرض للمستثمرين فقط — بيانات وهمية.",
  state: "Damascus" as const,
  governorate: "Damascus" as const,
  city: "Damascus" as const,
  cityAr: "دمشق" as const,
  area: "DEMO" as const,
  sybnbReview: review,
  status,
  price: new Prisma.Decimal(2500000),
  pricePerNight: 150000,
  guestsMax: 3,
  sybnbStayType: "apartment",
});

async function main() {
  assertDemoWriteAllowed("seed");
  if (process.env.DEMO_DATA_ENABLED !== "true") {
    throw new Error("Set DEMO_DATA_ENABLED=true to run investor demo seed (additive safety).");
  }

  await resetInvestorDemoData(prisma);

  const [host, hostPaused, guest, admin] = await Promise.all([
    prisma.syriaAppUser.create({
      data: {
        email: DEMO.host.email,
        name: DEMO.host.name,
        phone: "9639000001",
        role: "HOST",
        phoneVerifiedAt: new Date(),
        verifiedAt: new Date(),
        verificationLevel: "phone",
        sybnbSupplyPaused: false,
        demoMeta: INVESTOR_DEMO_META,
      },
    }),
    prisma.syriaAppUser.create({
      data: {
        email: DEMO.hostPaused.email,
        name: DEMO.hostPaused.name,
        phone: "9639000002",
        role: "HOST",
        phoneVerifiedAt: new Date(),
        verifiedAt: new Date(),
        verificationLevel: "phone",
        sybnbSupplyPaused: true,
        demoMeta: INVESTOR_DEMO_META,
      },
    }),
    prisma.syriaAppUser.create({
      data: {
        email: DEMO.guest.email,
        name: DEMO.guest.name,
        phone: "9639000003",
        role: "USER",
        phoneVerifiedAt: new Date(),
        verificationLevel: "phone",
        demoMeta: INVESTOR_DEMO_META,
      },
    }),
    prisma.syriaAppUser.create({
      data: {
        email: DEMO.admin.email,
        name: DEMO.admin.name,
        phone: "9639000004",
        role: "ADMIN",
        demoMeta: INVESTOR_DEMO_META,
      },
    }),
  ]);

  const mkListing = (ownerId: string, args: ReturnType<typeof baseStay>, extra?: { listingVerified?: boolean }) =>
    prisma.$transaction(async (tx) => {
      const adCode = await allocateAdCodeInTransaction(tx, "stay");
      return tx.syriaProperty.create({
        data: {
          adCode,
          titleAr: args.titleAr,
          titleEn: `DEMO en — ${args.titleAr.slice(0, 40)}`,
          descriptionAr: args.descriptionAr,
          state: args.state,
          governorate: args.governorate,
          city: args.city,
          cityAr: args.cityAr,
          cityEn: args.city,
          area: args.area,
          type: "RENT" as const,
          category: "stay" as const,
          subcategory: "stay" as const,
          price: args.price,
          pricePerNight: args.pricePerNight,
          guestsMax: args.guestsMax,
          sybnbStayType: args.sybnbStayType,
          images: [] as string[],
          amenities: ["wifi" as const, "furnished" as const],
          ownerId,
          status: args.status,
          sybnbReview: args.sybnbReview,
          currency: "SYP",
          plan: "free" as const,
          fraudFlag: false,
          needsReview: false,
          listingVerified: extra?.listingVerified ?? true,
          verified: true,
          isFeatured: false,
          isDirect: true,
          demoMeta: INVESTOR_DEMO_META,
        },
      });
    });

  // 6 approved
  const approved: Awaited<ReturnType<typeof mkListing>>[] = [];
  for (let i = 1; i <= 6; i += 1) {
    const p = await mkListing(host.id, baseStay(`إقامة قصيرة #${i}`, "APPROVED", "PUBLISHED"));
    approved.push(p);
  }
  // 2 pending (operator review)
  const pend: Awaited<ReturnType<typeof mkListing>>[] = [];
  for (let i = 1; i <= 2; i += 1) {
    pend.push(await mkListing(host.id, baseStay(`قيد المراجعة #${i}`, "PENDING", "PENDING_REVIEW")));
  }
  // 1 rejected
  const rejected = await mkListing(host.id, baseStay("مرفوض (عرض)", "REJECTED", "REJECTED"), { listingVerified: false });
  // 1 paused host — approved supply but host paused
  const pausedList = await mkListing(hostPaused.id, baseStay("مضيف متوقف — إقامة", "APPROVED", "PUBLISHED"));

  const now = new Date();
  const d = (n: number) => new Date(now.getTime() + n * 86400000);

  async function addSyriaStayBooking(
    prop: (typeof approved)[0],
    checkIn: Date,
    checkOut: Date,
    o: {
      status: "PENDING" | "APPROVED" | "COMPLETED" | "CANCELLED" | "CONFIRMED";
      guestPayment: "UNPAID" | "PENDING_MANUAL" | "PAID";
      riskStatus: "clear" | "review" | "blocked";
      checkedInAt?: Date | null;
    },
  ) {
    const q = computeSybnbQuote(prop, checkIn, checkOut);
    return prisma.syriaBooking.create({
      data: {
        propertyId: prop.id,
        guestId: guest.id,
        checkIn,
        checkOut,
        nightsCount: q.nights,
        nightlyRate: q.nightly,
        totalPrice: q.total,
        platformFeeAmount: q.platformFee,
        hostNetAmount: q.hostNet,
        currency: q.currency,
        status: o.status,
        guestPaymentStatus: o.guestPayment,
        riskStatus: o.riskStatus,
        guestCount: 2,
        checkedInAt: o.checkedInAt ?? null,
        payoutStatus: o.status === "COMPLETED" && o.guestPayment === "PAID" ? "PENDING" : "PENDING",
        demoMeta: INVESTOR_DEMO_META,
      },
    });
  }

  const b1 = await addSyriaStayBooking(approved[0]!, d(2), d(5), {
    status: "PENDING",
    guestPayment: "UNPAID",
    riskStatus: "clear",
  });
  const b2 = await addSyriaStayBooking(approved[1]!, d(7), d(9), {
    status: "APPROVED",
    guestPayment: "UNPAID",
    riskStatus: "review",
  });
  const b3 = await addSyriaStayBooking(approved[2]!, d(-14), d(-10), {
    status: "COMPLETED",
    guestPayment: "PAID",
    riskStatus: "clear",
    checkedInAt: d(-13),
  });
  const b4 = await addSyriaStayBooking(approved[3]!, d(20), d(24), {
    status: "CANCELLED",
    guestPayment: "UNPAID",
    riskStatus: "blocked",
  });

  await prisma.syriaSybnbCoreAudit.createMany({
    data: [
      { bookingId: b3.id, event: "demo_payout_risk", metadata: { ...INVESTOR_DEMO_META, level: "LOW" } },
      { bookingId: b2.id, event: "demo_payout_risk", metadata: { ...INVESTOR_DEMO_META, level: "MEDIUM" } },
      { bookingId: b4.id, event: "demo_payout_risk", metadata: { ...INVESTOR_DEMO_META, level: "HIGH" } },
    ],
  });

  await prisma.syriaGrowthEvent.createMany({
    data: [
      {
        eventType: "demo_investor_metric",
        userId: guest.id,
        propertyId: approved[0]!.id,
        payload: { ...INVESTOR_DEMO_META, n: 1 },
      },
      {
        eventType: "demo_investor_metric",
        userId: host.id,
        propertyId: approved[0]!.id,
        payload: { ...INVESTOR_DEMO_META, n: 2 },
      },
    ],
  });

  void rejected;
  void pend;
  void pausedList;

  console.log(
    `[investor-demo] seeded: demo users, 10 stay listings, 4 Syria bookings (ids: ${b1.id.slice(0, 8)}…). Admin: ${admin.email}. Set INVESTOR_DEMO_MODE=true to surface UI.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
