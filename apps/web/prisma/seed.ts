/**
 * Realistic simulation seed for the full platform.
 * Covers: Users, BNHub (listings, bookings, payments, reviews, disputes),
 * Projects (units, favorites, alerts, reservations), Leads, Referrals/Ambassador,
 * Real Estate Transactions (offers, timeline), Trust & Safety, Billing/Subscriptions.
 *
 * Run: npx prisma db seed (or npm run seed if script added)
 */

import { ImmoContactEventType } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { prisma } from "../lib/db";

const SEED_IDS = {
  guest: "seed-guest-001",
  host1: "seed-host-001",
  host2: "seed-host-002",
  broker: "seed-broker-001",
  ambassador: "seed-ambassador-001",
  admin: "seed-admin-001",
  investor: "seed-investor-001",
  propertyIdentity1: "seed-pi-001",
  propertyIdentity2: "seed-pi-002",
  listing1: "seed-listing-001",
  listing2: "seed-listing-002",
  listing3: "seed-listing-003",
  listing4: "seed-listing-004",
  listing5: "seed-listing-005",
  listing6: "seed-listing-006",
  booking1: "seed-booking-001",
  booking2: "seed-booking-002",
  booking3: "seed-booking-003",
  booking4: "seed-booking-004",
  /** Guest-owned, PENDING + payment PENDING — for Stripe checkout tests */
  bookingPendingCheckout: "seed-booking-pending-checkout",
  listingLuxuryMtl: "seed-listing-luxury-mtl",
  bookingDemo1: "seed-booking-demo-1",
  bookingDemo2: "seed-booking-demo-2",
  bookingDemo3: "seed-booking-demo-3",
  project1: "seed-project-001",
  project2: "seed-project-002",
  referralProgram: "seed-ref-program-001",
  transaction1: "seed-tx-001",
  planHostPro: "seed-plan-host-pro",
  rentDemoListing: "seed-rent-demo-001",
  rentDemoApp: "seed-rent-app-001",
  rentDemoLease: "seed-rent-lease-001",
  rentDemoPay: "seed-rent-pay-001",
} as const;

/** Exported for `scripts/reset-demo.ts` and `lib/demo-reset.ts` after DB truncate. */
export async function runSeed(): Promise<void> {
  console.log("Seeding realistic simulation data...\n");

  // ---------------------------------------------------------------------------
  // 1. Users (all roles)
  // ---------------------------------------------------------------------------
  const guestDemoPasswordHash = await hashPassword("DemoGuest2024!");
  const guest = await prisma.user.upsert({
    where: { email: "guest@demo.com" },
    update: {
      passwordHash: guestDemoPasswordHash,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
    create: {
      id: SEED_IDS.guest,
      email: "guest@demo.com",
      name: "Alex Traveller",
      role: "USER",
      plan: "free",
      passwordHash: guestDemoPasswordHash,
      emailVerifiedAt: new Date(),
    },
  });

  const adminPasswordHash = await hashPassword("AdminDemo2024!");
  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {
      passwordHash: adminPasswordHash,
      emailVerifiedAt: new Date(),
      role: "ADMIN",
      name: "Admin Demo",
      accountStatus: "ACTIVE",
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
    create: {
      id: SEED_IDS.admin,
      email: "admin@demo.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      name: "Admin Demo",
      plan: "free",
      accountStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  const platformDemoHash = await hashPassword("Demo123!");
  await prisma.user.upsert({
    where: { email: "demo@platform.com" },
    update: {
      passwordHash: platformDemoHash,
      emailVerifiedAt: new Date(),
      role: "TESTER",
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
    create: {
      email: "demo@platform.com",
      name: "Platform demo tester",
      role: "TESTER",
      plan: "free",
      passwordHash: platformDemoHash,
      emailVerifiedAt: new Date(),
    },
  });

  const host1 = await prisma.user.upsert({
    where: { email: "host@demo.com" },
    update: {
      emailVerifiedAt: new Date(),
      passwordHash: platformDemoHash,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
    create: {
      id: SEED_IDS.host1,
      email: "host@demo.com",
      name: "Marie Host",
      role: "HOST",
      plan: "basic",
      emailVerifiedAt: new Date(),
      passwordHash: platformDemoHash,
    },
  });

  const host2 = await prisma.user.upsert({
    where: { email: "host2@demo.com" },
    update: {
      emailVerifiedAt: new Date(),
      passwordHash: platformDemoHash,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
    create: {
      id: SEED_IDS.host2,
      email: "host2@demo.com",
      name: "Jean Property",
      role: "HOST",
      plan: "free",
      emailVerifiedAt: new Date(),
      passwordHash: platformDemoHash,
    },
  });

  const broker = await prisma.user.upsert({
    where: { email: "broker@demo.com" },
    update: {
      emailVerifiedAt: new Date(),
      passwordHash: platformDemoHash,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
    create: {
      id: SEED_IDS.broker,
      email: "broker@demo.com",
      name: "Sarah Broker",
      role: "BROKER",
      brokerStatus: "VERIFIED",
      plan: "pro",
      emailVerifiedAt: new Date(),
      passwordHash: platformDemoHash,
    },
  });

  const ambassadorUser = await prisma.user.upsert({
    where: { email: "ambassador@demo.com" },
    update: {
      emailVerifiedAt: new Date(),
      passwordHash: platformDemoHash,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
    create: {
      id: SEED_IDS.ambassador,
      email: "ambassador@demo.com",
      name: "Sam Ambassador",
      role: "USER",
      referralCode: "AMB-SAM-01",
      plan: "free",
      emailVerifiedAt: new Date(),
      passwordHash: platformDemoHash,
    },
  });

  const investor = await prisma.user.upsert({
    where: { email: "investor@demo.com" },
    update: {
      emailVerifiedAt: new Date(),
      passwordHash: platformDemoHash,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
    create: {
      id: SEED_IDS.investor,
      email: "investor@demo.com",
      name: "Jordan Investor",
      role: "USER",
      plan: "pro",
      emailVerifiedAt: new Date(),
      passwordHash: platformDemoHash,
    },
  });

  console.log("  Users created (guest, demo@platform.com, hosts, broker, ambassador, investor)");

  // ---------------------------------------------------------------------------
  // 2. Property identities (for listings + real estate transactions)
  // ---------------------------------------------------------------------------
  const propIdentity1 = await prisma.propertyIdentity.upsert({
    where: { propertyUid: "SIM-MTL-OLD-TOWN-001" },
    update: {},
    create: {
      id: SEED_IDS.propertyIdentity1,
      propertyUid: "SIM-MTL-OLD-TOWN-001",
      officialAddress: "123 Place Jacques-Cartier",
      normalizedAddress: "123 place jacques-cartier montreal qc",
      municipality: "Montreal",
      province: "QC",
      country: "CA",
      latitude: 45.5088,
      longitude: -73.5542,
      propertyType: "apartment",
    },
  });

  const propIdentity2 = await prisma.propertyIdentity.upsert({
    where: { propertyUid: "SIM-QC-VILLA-002" },
    update: {},
    create: {
      id: SEED_IDS.propertyIdentity2,
      propertyUid: "SIM-QC-VILLA-002",
      officialAddress: "456 Chemin du Lac",
      normalizedAddress: "456 chemin du lac tremblant qc",
      municipality: "Mont-Tremblant",
      province: "QC",
      country: "CA",
      latitude: 46.2125,
      longitude: -74.5908,
      propertyType: "house",
    },
  });

  console.log("  Property identities created");

  // ---------------------------------------------------------------------------
  // 3. Short-term listings (BNHub) – multiple cities and statuses
  // ---------------------------------------------------------------------------
  const listing1 = await prisma.shortTermListing.upsert({
    where: { id: SEED_IDS.listing1 },
    update: { listingCode: "LEC-90001", instantBookEnabled: true },
    create: {
      id: SEED_IDS.listing1,
      listingCode: "LEC-90001",
      title: "Cozy loft in Old Montreal",
      description: "Walking distance to Notre-Dame, cafés, and the river.",
      address: "123 Place Jacques-Cartier",
      city: "Montreal",
      region: "Quebec",
      country: "CA",
      latitude: 45.5088,
      longitude: -73.5542,
      nightPriceCents: 12500,
      beds: 2,
      baths: 1,
      maxGuests: 4,
      photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
      amenities: ["WiFi", "Kitchen", "AC"],
      listingStatus: "PUBLISHED",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      propertyIdentityId: propIdentity1.id,
      ownerId: host1.id,
      instantBookEnabled: true,
    },
  });

  const listing2 = await prisma.shortTermListing.upsert({
    where: { id: SEED_IDS.listing2 },
    update: { listingCode: "LEC-90002", instantBookEnabled: true },
    create: {
      id: SEED_IDS.listing2,
      listingCode: "LEC-90002",
      title: "Lakeside cabin near Tremblant",
      description: "Quiet cabin with lake view. Ski resort 15 min away.",
      address: "456 Chemin du Lac",
      city: "Mont-Tremblant",
      region: "Quebec",
      country: "CA",
      latitude: 46.2125,
      longitude: -74.5908,
      nightPriceCents: 18000,
      beds: 3,
      baths: 2,
      maxGuests: 6,
      photos: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"],
      amenities: ["WiFi", "Kitchen", "Fireplace", "Parking"],
      listingStatus: "PUBLISHED",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      propertyIdentityId: propIdentity2.id,
      ownerId: host2.id,
      instantBookEnabled: true,
    },
  });

  const listing3 = await prisma.shortTermListing.upsert({
    where: { id: SEED_IDS.listing3 },
    update: { listingCode: "LEC-90003" },
    create: {
      id: SEED_IDS.listing3,
      listingCode: "LEC-90003",
      title: "Downtown studio – Plateau",
      description: "Bright studio in the heart of Plateau Mont-Royal.",
      address: "789 Avenue du Mont-Royal",
      city: "Montreal",
      region: "Quebec",
      country: "CA",
      nightPriceCents: 9500,
      beds: 1,
      baths: 1,
      maxGuests: 2,
      photos: [],
      listingStatus: "PUBLISHED",
      ownerId: host1.id,
    },
  });

  const listing4 = await prisma.shortTermListing.upsert({
    where: { id: SEED_IDS.listing4 },
    update: {},
    create: {
      id: SEED_IDS.listing4,
      listingCode: "LEC-90004",
      title: "Luxury condo with view",
      description: "High-floor condo with city and river views.",
      address: "1000 Rue de la Commune",
      city: "Montreal",
      region: "Quebec",
      country: "CA",
      nightPriceCents: 25000,
      beds: 2,
      baths: 2,
      maxGuests: 4,
      listingStatus: "DRAFT",
      ownerId: host2.id,
    },
  });

  await prisma.shortTermListing.upsert({
    where: { id: SEED_IDS.listing5 },
    update: { listingCode: "LEC-90006" },
    create: {
      id: SEED_IDS.listing5,
      listingCode: "LEC-90006",
      title: "Modern riverside apartment Laval",
      description: "Modern apartment close to transit and waterfront.",
      address: "220 Boulevard des Prairies",
      city: "Laval",
      region: "Quebec",
      country: "CA",
      nightPriceCents: 13500,
      beds: 2,
      baths: 1,
      maxGuests: 4,
      photos: ["https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800"],
      amenities: ["WiFi", "Kitchen", "Parking"],
      listingStatus: "PUBLISHED",
      ownerId: host1.id,
    },
  });

  await prisma.shortTermListing.upsert({
    where: { id: SEED_IDS.listing6 },
    update: { listingCode: "LEC-90007" },
    create: {
      id: SEED_IDS.listing6,
      listingCode: "LEC-90007",
      title: "Quiet family home in Mirabel",
      description: "Spacious stay in a calm Mirabel neighborhood.",
      address: "75 Rue du Verger",
      city: "Mirabel",
      region: "Quebec",
      country: "CA",
      nightPriceCents: 15000,
      beds: 3,
      baths: 2,
      maxGuests: 6,
      photos: ["https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800"],
      amenities: ["WiFi", "Kitchen", "Washer", "Parking"],
      listingStatus: "PUBLISHED",
      ownerId: host2.id,
    },
  });

  console.log("  Short-term listings created (6)");

  // ---------------------------------------------------------------------------
  // 4. Bookings – PENDING, CONFIRMED, COMPLETED, DISPUTED
  // ---------------------------------------------------------------------------
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekPlus3 = new Date(nextWeek);
  nextWeekPlus3.setDate(nextWeekPlus3.getDate() + 3);
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthPlus3 = new Date(lastMonth);
  lastMonthPlus3.setDate(lastMonthPlus3.getDate() + 3);

  const booking1 = await prisma.booking.upsert({
    where: { id: SEED_IDS.booking1 },
    update: { confirmationCode: "BNH-SEED01" },
    create: {
      id: SEED_IDS.booking1,
      checkIn: nextWeek,
      checkOut: nextWeekPlus3,
      nights: 3,
      totalCents: listing1.nightPriceCents * 3,
      guestFeeCents: 0,
      hostFeeCents: 0,
      status: "CONFIRMED",
      guestId: guest.id,
      listingId: listing1.id,
      confirmationCode: "BNH-SEED01",
    },
  });

  const booking2 = await prisma.booking.upsert({
    where: { id: SEED_IDS.booking2 },
    update: { confirmationCode: "BNH-SEED02" },
    create: {
      id: SEED_IDS.booking2,
      checkIn: lastMonth,
      checkOut: lastMonthPlus3,
      nights: 3,
      totalCents: listing2.nightPriceCents * 3,
      guestFeeCents: 0,
      hostFeeCents: 0,
      status: "COMPLETED",
      guestId: guest.id,
      listingId: listing2.id,
      confirmationCode: "BNH-SEED02",
    },
  });

  const booking3 = await prisma.booking.upsert({
    where: { id: SEED_IDS.booking3 },
    update: { confirmationCode: "BNH-SEED03" },
    create: {
      id: SEED_IDS.booking3,
      checkIn: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      checkOut: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
      nights: 3,
      totalCents: listing3.nightPriceCents * 3,
      guestFeeCents: 0,
      hostFeeCents: 0,
      status: "PENDING",
      guestId: investor.id,
      listingId: listing3.id,
      confirmationCode: "BNH-SEED03",
    },
  });

  const booking4 = await prisma.booking.upsert({
    where: { id: SEED_IDS.booking4 },
    update: { confirmationCode: "BNH-SEED04" },
    create: {
      id: SEED_IDS.booking4,
      checkIn: new Date(lastMonth.getTime() - 7 * 24 * 60 * 60 * 1000),
      checkOut: new Date(lastMonth.getTime() - 4 * 24 * 60 * 60 * 1000),
      nights: 3,
      totalCents: listing1.nightPriceCents * 3,
      guestFeeCents: 0,
      hostFeeCents: 0,
      status: "DISPUTED",
      guestId: investor.id,
      listingId: listing1.id,
      confirmationCode: "BNH-SEED04",
    },
  });

  const bookingPendingCheckout = await prisma.booking.upsert({
    where: { id: SEED_IDS.bookingPendingCheckout },
    update: { confirmationCode: "BNH-SEED05" },
    create: {
      id: SEED_IDS.bookingPendingCheckout,
      checkIn: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      checkOut: new Date(now.getTime() + 24 * 24 * 60 * 60 * 1000),
      nights: 3,
      totalCents: listing1.nightPriceCents * 3,
      guestFeeCents: 0,
      hostFeeCents: 0,
      status: "PENDING",
      guestId: guest.id,
      listingId: listing1.id,
      confirmationCode: "BNH-SEED05",
    },
  });

  console.log("  Bookings created (confirmed, completed, pending, disputed)");

  // ---------------------------------------------------------------------------
  // 5. Payments for confirmed/completed bookings
  // ---------------------------------------------------------------------------
  const hostPayout1 = Math.floor(booking1.totalCents * 0.97);
  await prisma.payment.upsert({
    where: { bookingId: booking1.id },
    update: {},
    create: {
      amountCents: booking1.totalCents,
      guestFeeCents: 0,
      hostFeeCents: booking1.totalCents - hostPayout1,
      hostPayoutCents: hostPayout1,
      status: "COMPLETED",
      stripePaymentId: "sim_pi_001",
      bookingId: booking1.id,
    },
  });

  const hostPayout2 = Math.floor(booking2.totalCents * 0.97);
  await prisma.payment.upsert({
    where: { bookingId: booking2.id },
    update: {},
    create: {
      amountCents: booking2.totalCents,
      guestFeeCents: 0,
      hostFeeCents: booking2.totalCents - hostPayout2,
      hostPayoutCents: hostPayout2,
      status: "COMPLETED",
      stripePaymentId: "sim_pi_002",
      hostPayoutReleasedAt: new Date(),
      bookingId: booking2.id,
    },
  });

  console.log("  Payments created for confirmed/completed bookings");

  const hostPayoutPendingCheckout = Math.floor(bookingPendingCheckout.totalCents * 0.97);
  await prisma.payment.upsert({
    where: { bookingId: bookingPendingCheckout.id },
    update: {
      status: "PENDING",
      amountCents: bookingPendingCheckout.totalCents,
      guestFeeCents: 0,
      hostFeeCents: bookingPendingCheckout.totalCents - hostPayoutPendingCheckout,
      hostPayoutCents: hostPayoutPendingCheckout,
    },
    create: {
      amountCents: bookingPendingCheckout.totalCents,
      guestFeeCents: 0,
      hostFeeCents: bookingPendingCheckout.totalCents - hostPayoutPendingCheckout,
      hostPayoutCents: hostPayoutPendingCheckout,
      status: "PENDING",
      bookingId: bookingPendingCheckout.id,
    },
  });

  console.log("  Pending payment row for checkout test booking");

  // ---------------------------------------------------------------------------
  // 5b. BNHub dashboard demo: 1 listing + 3 bookings (bookings > 0, occupancy > 0, revenue > 0)
  // ---------------------------------------------------------------------------
  const luxuryListing = await prisma.shortTermListing.upsert({
    where: { id: SEED_IDS.listingLuxuryMtl },
    update: {
      title: "Luxury Apartment Montreal",
      nightPriceCents: 12000,
      city: "Montreal",
      listingCode: "LEC-90005",
    },
    create: {
      id: SEED_IDS.listingLuxuryMtl,
      listingCode: "LEC-90005",
      title: "Luxury Apartment Montreal",
      description: "Premium apartment in the heart of Montreal.",
      address: "1500 Rue Sherbrooke Ouest",
      city: "Montreal",
      region: "Quebec",
      country: "CA",
      nightPriceCents: 12000, // $120/night
      beds: 2,
      baths: 2,
      maxGuests: 4,
      listingStatus: "PUBLISHED",
      ownerId: host1.id,
    },
  });

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayPlus3 = new Date(today);
  todayPlus3.setDate(todayPlus3.getDate() + 3);
  const in5Days = new Date(today);
  in5Days.setDate(in5Days.getDate() + 5);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const earlierMonthStart = new Date(now.getFullYear(), now.getMonth(), 2);
  const earlierMonthEnd = new Date(now.getFullYear(), now.getMonth(), 5);

  const bDemo1 = await prisma.booking.upsert({
    where: { id: SEED_IDS.bookingDemo1 },
    update: { confirmationCode: "BNH-SEED06" },
    create: {
      id: SEED_IDS.bookingDemo1,
      checkIn: today,
      checkOut: todayPlus3,
      nights: 3,
      totalCents: 36000, // $360
      guestFeeCents: 0,
      hostFeeCents: 0,
      status: "CONFIRMED",
      guestId: guest.id,
      listingId: luxuryListing.id,
      confirmationCode: "BNH-SEED06",
    },
  });

  const bDemo2 = await prisma.booking.upsert({
    where: { id: SEED_IDS.bookingDemo2 },
    update: { confirmationCode: "BNH-SEED07" },
    create: {
      id: SEED_IDS.bookingDemo2,
      checkIn: in5Days,
      checkOut: in7Days,
      nights: 2,
      totalCents: 24000, // $240
      guestFeeCents: 0,
      hostFeeCents: 0,
      status: "CONFIRMED",
      guestId: guest.id,
      listingId: luxuryListing.id,
      confirmationCode: "BNH-SEED07",
    },
  });

  const bDemo3 = await prisma.booking.upsert({
    where: { id: SEED_IDS.bookingDemo3 },
    update: { confirmationCode: "BNH-SEED08" },
    create: {
      id: SEED_IDS.bookingDemo3,
      checkIn: earlierMonthStart,
      checkOut: earlierMonthEnd,
      nights: 3,
      totalCents: 50000, // $500
      guestFeeCents: 0,
      hostFeeCents: 0,
      status: "CONFIRMED",
      guestId: guest.id,
      listingId: luxuryListing.id,
      confirmationCode: "BNH-SEED08",
    },
  });

  const hostPayoutDemo1 = Math.floor(bDemo1.totalCents * 0.97);
  await prisma.payment.upsert({
    where: { bookingId: bDemo1.id },
    update: {},
    create: {
      amountCents: bDemo1.totalCents,
      guestFeeCents: 0,
      hostFeeCents: bDemo1.totalCents - hostPayoutDemo1,
      hostPayoutCents: hostPayoutDemo1,
      status: "COMPLETED",
      bookingId: bDemo1.id,
    },
  });

  const hostPayoutDemo3 = Math.floor(bDemo3.totalCents * 0.97);
  await prisma.payment.upsert({
    where: { bookingId: bDemo3.id },
    update: {},
    create: {
      amountCents: bDemo3.totalCents,
      guestFeeCents: 0,
      hostFeeCents: bDemo3.totalCents - hostPayoutDemo3,
      hostPayoutCents: hostPayoutDemo3,
      status: "COMPLETED",
      bookingId: bDemo3.id,
    },
  });

  console.log("  BNHub dashboard demo: Luxury Apartment Montreal + 3 bookings (revenue > 0)");

  // ---------------------------------------------------------------------------
  // 6. Review for completed booking
  // ---------------------------------------------------------------------------
  await prisma.review.upsert({
    where: { bookingId: booking2.id },
    update: {},
    create: {
      propertyRating: 5,
      hostRating: 5,
      cleanlinessRating: 5,
      communicationRating: 5,
      locationRating: 5,
      valueRating: 5,
      comment: "Perfect stay. The cabin was exactly as described.",
      createdAt: new Date(lastMonthPlus3.getTime() + 2 * 60 * 60 * 1000),
      guestId: guest.id,
      listingId: listing2.id,
      bookingId: booking2.id,
    },
  });

  console.log("  Review created for completed booking");

  // ---------------------------------------------------------------------------
  // 7. Dispute (one open)
  // ---------------------------------------------------------------------------
  await prisma.dispute.upsert({
    where: { id: "seed-dispute-001" },
    update: {},
    create: {
      id: "seed-dispute-001",
      bookingId: booking4.id,
      listingId: listing1.id,
      claimant: "GUEST",
      claimantUserId: investor.id,
      description: "Property was not as described; cleanliness issues.",
      complaintCategory: "property_condition",
      status: "UNDER_REVIEW",
      urgencyLevel: "normal",
    },
  });

  console.log("  Dispute created (under review)");

  // ---------------------------------------------------------------------------
  // 8. Host quality (for host1)
  // ---------------------------------------------------------------------------
  await prisma.hostQuality.upsert({
    where: { userId: host1.id },
    update: {},
    create: {
      userId: host1.id,
      qualityScore: 4.8,
      isSuperHost: true,
      cancellationRate: 0.02,
      avgResponseMinutes: 45,
    },
  });

  console.log("  Host quality created");

  // ---------------------------------------------------------------------------
  // 9. Referral program + Referral + Ambassador
  // ---------------------------------------------------------------------------
  const refProgram = await prisma.referralProgram.upsert({
    where: { id: SEED_IDS.referralProgram },
    update: {},
    create: {
      id: SEED_IDS.referralProgram,
      name: "Host Referral Program",
      rewardCreditsReferrer: 1000,
      rewardCreditsReferee: 500,
      active: true,
    },
  });

  const referralCode = "DEMO-REF-001";
  await prisma.referral.upsert({
    where: { code: referralCode },
    update: {},
    create: {
      programId: refProgram.id,
      referrerId: ambassadorUser.id,
      code: referralCode,
      rewardCreditsCents: 1000,
      usedByUserId: guest.id,
      usedAt: new Date(),
    },
  });

  const ambassador = await prisma.ambassador.upsert({
    where: { userId: ambassadorUser.id },
    update: {},
    create: {
      userId: ambassadorUser.id,
      isActive: true,
      commission: 0.1,
    },
  });

  await prisma.commission.create({
    data: {
      ambassadorId: ambassador.id,
      amount: 25.5,
      sourceType: "subscription",
      sourceId: "sim-sub-001",
    },
  });

  console.log("  Referral program, referral, ambassador, commission created");

  // ---------------------------------------------------------------------------
  // 10. Projects (new developments) + units, subscription, favorites, alerts, reservations
  // ---------------------------------------------------------------------------
  const delivery1 = new Date();
  delivery1.setFullYear(delivery1.getFullYear() + 2);
  const delivery2 = new Date();
  delivery2.setFullYear(delivery2.getFullYear() + 1);

  const project1 = await prisma.project.upsert({
    where: { id: SEED_IDS.project1 },
    update: {},
    create: {
      id: SEED_IDS.project1,
      name: "Riverside Towers",
      description: "Luxury condos with river view. Amenities: pool, gym, concierge.",
      city: "Montreal",
      address: "2000 Rue du Fleuve",
      developer: "Riverside Developments",
      deliveryDate: delivery1,
      startingPrice: 450000,
      status: "under-construction",
      heroImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      featured: true,
      featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      latitude: 45.51,
      longitude: -73.55,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: SEED_IDS.project2 },
    update: {},
    create: {
      id: SEED_IDS.project2,
      name: "Plateau Living",
      description: "Family-friendly units near parks and schools.",
      city: "Montreal",
      address: "5000 Boulevard Saint-Laurent",
      developer: "Plateau Builders",
      deliveryDate: delivery2,
      startingPrice: 380000,
      status: "upcoming",
      latitude: 45.53,
      longitude: -73.57,
    },
  });

  const unit1 = await prisma.projectUnit.upsert({
    where: { id: "seed-unit-p1-1" },
    update: {},
    create: {
      id: "seed-unit-p1-1",
      projectId: project1.id,
      type: "2bed",
      price: 485000,
      size: 95,
      status: "available",
    },
  });

  const unit2 = await prisma.projectUnit.upsert({
    where: { id: "seed-unit-p1-2" },
    update: {},
    create: {
      id: "seed-unit-p1-2",
      projectId: project1.id,
      type: "1bed",
      price: 420000,
      size: 65,
      status: "reserved",
    },
  });

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);
  await prisma.projectSubscription.upsert({
    where: { projectId: project1.id },
    update: {},
    create: {
      projectId: project1.id,
      isTrial: true,
      trialEnd,
      plan: "basic",
      isActive: true,
    },
  });

  await prisma.favoriteProject.upsert({
    where: { userId_projectId: { userId: guest.id, projectId: project1.id } },
    update: {},
    create: {
      userId: guest.id,
      projectId: project1.id,
    },
  });

  await prisma.projectAlert.create({
    data: {
      userId: guest.id,
      city: "Montreal",
      maxPrice: 500000,
      minPrice: 300000,
      deliveryYear: delivery1.getFullYear(),
      alertType: "new-project",
      isActive: true,
    },
  });

  await prisma.projectReservation.create({
    data: {
      userId: guest.id,
      projectId: project1.id,
      projectUnitId: unit2.id,
      status: "reserved",
      fullName: guest.name ?? "Alex Traveller",
      email: guest.email,
      phone: "+15551234567",
      note: "Interested in Q3 delivery.",
    },
  });

  console.log("  Projects, units, subscription, favorite, alert, reservation created");

  // ---------------------------------------------------------------------------
  // 11. Leads (project and listing context)
  // ---------------------------------------------------------------------------
  await prisma.lead.create({
    data: {
      name: "Emma Buyer",
      email: "emma@example.com",
      phone: "+15559876543",
      message: "Interested in 2-bed units. When is the next viewing?",
      projectId: project1.id,
      status: "new",
      score: 75,
      contactUnlockedAt: new Date(),
    },
  });

  await prisma.lead.create({
    data: {
      name: "David Smith",
      email: "david@example.com",
      phone: "+15555551234",
      message: "Looking for investment in Plateau area.",
      projectId: project2.id,
      status: "contacted",
      score: 60,
    },
  });

  console.log("  Leads created");

  // ---------------------------------------------------------------------------
  // 12. Real estate transaction (offer + timeline)
  // ---------------------------------------------------------------------------
  const transaction = await prisma.realEstateTransaction.upsert({
    where: { id: SEED_IDS.transaction1 },
    update: {},
    create: {
      id: SEED_IDS.transaction1,
      propertyIdentityId: propIdentity1.id,
      listingId: listing1.id,
      buyerId: investor.id,
      sellerId: host1.id,
      brokerId: broker.id,
      offerPrice: 42000000, // 420k in cents
      status: "negotiation",
    },
  });

  await prisma.propertyOffer.create({
    data: {
      transactionId: transaction.id,
      buyerId: investor.id,
      offerPrice: 40000000,
      status: "countered",
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const timeline = await prisma.transactionTimeline.upsert({
    where: { transactionId: transaction.id },
    update: {},
    create: {
      transactionId: transaction.id,
      propertyIdentityId: propIdentity1.id,
      listingId: listing1.id,
      buyerId: investor.id,
      sellerId: host1.id,
      brokerId: broker.id,
      currentStage: "negotiation",
      status: "active",
      nextRequiredAction: "Buyer to respond to counter-offer",
    },
  });

  await prisma.transactionTimelineStep.create({
    data: {
      timelineId: timeline.id,
      stepCode: "offer_submit",
      stepName: "Offer submitted",
      stageName: "offer_submitted",
      status: "completed",
      assignedToRole: "buyer",
    },
  });

  await prisma.transactionTimelineStep.create({
    data: {
      timelineId: timeline.id,
      stepCode: "counter_offer",
      stepName: "Counter offer sent",
      stageName: "negotiation",
      status: "completed",
      assignedToRole: "seller",
    },
  });

  await prisma.transactionTimelineStep.create({
    data: {
      timelineId: timeline.id,
      stepCode: "deposit_pay",
      stepName: "Deposit payment",
      stageName: "deposit_pending",
      status: "pending",
      assignedToRole: "buyer",
    },
  });

  console.log("  Real estate transaction, offer, timeline, steps created");

  // ---------------------------------------------------------------------------
  // 13. Trust & Safety incidents
  // ---------------------------------------------------------------------------
  const incident1 = await prisma.trustSafetyIncident.create({
    data: {
      reporterId: guest.id,
      accusedUserId: host1.id,
      listingId: listing1.id,
      bookingId: booking4.id,
      incidentCategory: "property_condition",
      severityLevel: "MEDIUM",
      riskLevel: "LOW_RISK",
      status: "UNDER_REVIEW",
      description: "Guest reported cleanliness and accuracy issues; dispute opened.",
    },
  });

  await prisma.trustSafetyIncidentResponse.create({
    data: {
      incidentId: incident1.id,
      respondentId: host1.id,
      body: "We have addressed the cleaning protocol. Happy to offer a partial refund.",
      createdAt: new Date(),
    },
  });

  await prisma.trustSafetyIncident.create({
    data: {
      reporterId: guest.id,
      listingId: listing3.id,
      incidentCategory: "noise_complaint",
      severityLevel: "LOW",
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedBy: "seed-admin",
      resolutionNotes: "Informational; no action required.",
      description: "Neighbour reported noise; resolved with guest.",
    },
  });

  console.log("  Trust & Safety incidents and response created");

  // ---------------------------------------------------------------------------
  // 14. Billing: Subscription plan + subscription + invoice
  // ---------------------------------------------------------------------------
  const plan = await prisma.subscriptionPlan.upsert({
    where: { slug: "host-pro-monthly" },
    update: {},
    create: {
      id: SEED_IDS.planHostPro,
      name: "Host Pro",
      slug: "host-pro-monthly",
      module: "HOST_PRO",
      billingCycle: "MONTHLY",
      amountCents: 2999,
      currency: "USD",
      trialDays: 14,
      active: true,
    },
  });

  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  const subscription = await prisma.planSubscription.create({
    data: {
      userId: host1.id,
      planId: plan.id,
      status: "ACTIVE",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-SIM-001" },
    update: {
      subscriptionId: subscription.id,
      amountCents: 2999,
      status: "PAID",
      dueDate: periodStart,
      paidAt: periodStart,
    },
    create: {
      subscriptionId: subscription.id,
      amountCents: 2999,
      status: "PAID",
      dueDate: periodStart,
      paidAt: periodStart,
      invoiceNumber: "INV-SIM-001",
    },
  });

  await prisma.planBillingEvent.create({
    data: {
      subscriptionId: subscription.id,
      userId: host1.id,
      eventType: "PAYMENT_SUCCEEDED",
      amountCents: 2999,
    },
  });

  console.log("  Subscription plan, subscription, invoice, billing event created");

  // ---------------------------------------------------------------------------
  // 15. Property (long-term/sale – keep existing)
  // ---------------------------------------------------------------------------
  await prisma.property.upsert({
    where: { id: "test-property-1" },
    update: {},
    create: {
      id: "test-property-1",
      price: 350000,
      city: "Demo City",
      address: "100 Investment Ave",
      beds: 3,
      baths: 2,
      sqft: 1800,
      propertyType: "Single Family",
      ownerId: host1.id,
    },
  }).catch(() => null);

  // Keep PostgreSQL sequence past max LEC suffix (BNHub + CRM Listing)
  await prisma.$executeRawUnsafe(`
    CREATE SEQUENCE IF NOT EXISTS lec_listing_code_seq START WITH 10001 INCREMENT BY 1;
  `);
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      'lec_listing_code_seq',
      GREATEST(
        10000,
        COALESCE(
          (
            SELECT MAX(CAST(regexp_replace(lc, '^LEC-', '') AS BIGINT))
            FROM (
              SELECT "listing_code" AS lc FROM "bnhub_listings" WHERE "listing_code" ~ '^LEC-[0-9]+$'
              UNION ALL
              SELECT "listing_code" AS lc FROM "Listing" WHERE "listing_code" ~ '^LEC-[0-9]+$'
            ) x
          ),
          10000
        )
      )::bigint
    )
  `);

  // ---------------------------------------------------------------------------
  // Welcome tax & incentive placeholders (admin should verify / replace)
  // ---------------------------------------------------------------------------
  await prisma.welcomeTaxMunicipalityConfig.upsert({
    where: { slug: "montreal-example" },
    update: {},
    create: {
      slug: "montreal-example",
      name: "Montreal (example — verify with official schedule)",
      bracketsJson: [
        { minCents: 0, maxCents: 5520000, marginalRatePct: 0.5 },
        { minCents: 5520000, maxCents: 30250000, marginalRatePct: 1.0 },
        { minCents: 30250000, maxCents: null, marginalRatePct: 1.5 },
      ],
      rebateRulesJson: {
        first_time: { maxRebateCents: 0, notes: "Placeholder — configure verified first-time rules in admin." },
      },
      active: true,
      notes: "Illustrative progressive brackets only. Replace with verified municipal data.",
    },
  });

  await prisma.incentiveProgramConfig.upsert({
    where: { id: "seed-incentive-fhb-placeholder" },
    update: {},
    create: {
      id: "seed-incentive-fhb-placeholder",
      title: "First-time home buyer programs (verify eligibility)",
      description:
        "Federal and provincial programs may offer shared equity or rebates. Eligibility rules change — confirm with a mortgage broker and notary.",
      jurisdiction: "federal",
      active: true,
      externalLink: null,
      notes: "Placeholder content block. Admin can edit or deactivate.",
      sortOrder: 0,
    },
  });

  // ---------------------------------------------------------------------------
  // Demo-perfect hub data: FSBO (seller+buyer), broker CRM, rent lifecycle, investor scenario
  // ---------------------------------------------------------------------------
  const { DEFAULT_RENTAL_LEASE_CONTRACT } = await import("../lib/rental/default-contract");

  const demoImg = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800";

  const fsboDraftGuest = await prisma.fsboListing.upsert({
    where: { id: "seed-fsbo-seller-draft-001" },
    update: {},
    create: {
      id: "seed-fsbo-seller-draft-001",
      ownerId: guest.id,
      title: "Waterfront condo — draft",
      description:
        "Demo draft: add photos, seller declaration, and documents before you publish to BuyHub search.",
      priceCents: 589_000_00,
      address: "800 Rue de la Commune E",
      city: "Montreal",
      images: [demoImg],
      coverImage: demoImg,
      status: "DRAFT",
      moderationStatus: "APPROVED",
      contactEmail: guest.email,
      listingDealType: "SALE",
    },
  });
  await prisma.fsboListingVerification.upsert({
    where: { fsboListingId: fsboDraftGuest.id },
    update: {},
    create: { fsboListingId: fsboDraftGuest.id },
  });

  const fsboLiveGuest = await prisma.fsboListing.upsert({
    where: { id: "seed-fsbo-seller-live-001" },
    update: { listingCode: "LST-DEMO-001" },
    create: {
      id: "seed-fsbo-seller-live-001",
      listingCode: "LST-DEMO-001",
      ownerId: guest.id,
      title: "Sunny 3BR — Plateau (live)",
      description:
        "Corner unit with parking. Steps from cafés and transit. Demo published listing for Seller Hub.",
      priceCents: 725_000_00,
      address: "4500 Rue Saint-Denis",
      city: "Montreal",
      images: [demoImg],
      coverImage: demoImg,
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      contactEmail: guest.email,
      listingDealType: "SALE",
    },
  });
  await prisma.fsboListingVerification.upsert({
    where: { fsboListingId: fsboLiveGuest.id },
    update: {
      identityStatus: "VERIFIED",
      cadasterStatus: "VERIFIED",
      addressStatus: "VERIFIED",
      sellerDeclarationStatus: "VERIFIED",
      disclosuresStatus: "VERIFIED",
    },
    create: {
      fsboListingId: fsboLiveGuest.id,
      identityStatus: "VERIFIED",
      cadasterStatus: "VERIFIED",
      addressStatus: "VERIFIED",
      sellerDeclarationStatus: "VERIFIED",
      disclosuresStatus: "VERIFIED",
    },
  });

  const fsboHostBuyerTarget = await prisma.fsboListing.upsert({
    where: { id: "seed-fsbo-buyer-contact-001" },
    update: { listingCode: "LST-DEMO-HOST" },
    create: {
      id: "seed-fsbo-buyer-contact-001",
      listingCode: "LST-DEMO-HOST",
      ownerId: host1.id,
      title: "Heritage rowhouse — Old Montreal",
      description: "Walk to the river and downtown. Demo listing for buyer saved + contact activity.",
      priceCents: 899_000_00,
      address: "220 Rue Saint-Paul E",
      city: "Montreal",
      images: [demoImg],
      coverImage: demoImg,
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      contactEmail: host1.email ?? "host@demo.com",
      listingDealType: "SALE",
    },
  });
  await prisma.fsboListingVerification.upsert({
    where: { fsboListingId: fsboHostBuyerTarget.id },
    update: {
      identityStatus: "VERIFIED",
      cadasterStatus: "VERIFIED",
      addressStatus: "VERIFIED",
      sellerDeclarationStatus: "VERIFIED",
      disclosuresStatus: "VERIFIED",
    },
    create: {
      fsboListingId: fsboHostBuyerTarget.id,
      identityStatus: "VERIFIED",
      cadasterStatus: "VERIFIED",
      addressStatus: "VERIFIED",
      sellerDeclarationStatus: "VERIFIED",
      disclosuresStatus: "VERIFIED",
    },
  });

  const fsboDemo004 = await prisma.fsboListing.upsert({
    where: { id: "seed-fsbo-demo-004" },
    update: { listingCode: "LST-DEMO-004" },
    create: {
      id: "seed-fsbo-demo-004",
      listingCode: "LST-DEMO-004",
      ownerId: guest.id,
      title: "Bright 2BR — Rosemont (demo)",
      description: "Walk to Metro. Demo listing for browse diversity.",
      priceCents: 598_000_00,
      address: "5100 Rue D'Iberville",
      city: "Montreal",
      images: [demoImg],
      coverImage: demoImg,
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      contactEmail: guest.email,
      listingDealType: "SALE",
    },
  });
  await prisma.fsboListingVerification.upsert({
    where: { fsboListingId: fsboDemo004.id },
    update: {},
    create: {
      fsboListingId: fsboDemo004.id,
      identityStatus: "VERIFIED",
      cadasterStatus: "VERIFIED",
      addressStatus: "VERIFIED",
      sellerDeclarationStatus: "VERIFIED",
      disclosuresStatus: "VERIFIED",
    },
  });

  const fsboDemo005 = await prisma.fsboListing.upsert({
    where: { id: "seed-fsbo-demo-005" },
    update: { listingCode: "LST-DEMO-005" },
    create: {
      id: "seed-fsbo-demo-005",
      listingCode: "LST-DEMO-005",
      ownerId: guest.id,
      title: "Loft conversion — Mile End (demo)",
      description: "Exposed brick. Demo listing for buyer compare.",
      priceCents: 679_000_00,
      address: "120 Rue Saint-Viateur E",
      city: "Montreal",
      images: [demoImg],
      coverImage: demoImg,
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      contactEmail: guest.email,
      listingDealType: "SALE",
    },
  });
  await prisma.fsboListingVerification.upsert({
    where: { fsboListingId: fsboDemo005.id },
    update: {},
    create: {
      fsboListingId: fsboDemo005.id,
      identityStatus: "VERIFIED",
      cadasterStatus: "VERIFIED",
      addressStatus: "VERIFIED",
      sellerDeclarationStatus: "VERIFIED",
      disclosuresStatus: "VERIFIED",
    },
  });

  await prisma.buyerSavedListing.upsert({
    where: {
      userId_fsboListingId: { userId: guest.id, fsboListingId: fsboHostBuyerTarget.id },
    },
    update: {},
    create: { userId: guest.id, fsboListingId: fsboHostBuyerTarget.id },
  });

  await prisma.buyerListingView.upsert({
    where: { id: "seed-buyer-listing-view-001" },
    update: {},
    create: {
      id: "seed-buyer-listing-view-001",
      userId: guest.id,
      fsboListingId: fsboHostBuyerTarget.id,
    },
  });

  await prisma.buyerListingView.upsert({
    where: { id: "seed-buyer-listing-view-002" },
    update: {},
    create: {
      id: "seed-buyer-listing-view-002",
      userId: guest.id,
      fsboListingId: fsboLiveGuest.id,
    },
  });

  await prisma.buyerRequest.upsert({
    where: { id: "seed-buyer-req-001" },
    update: {},
    create: {
      id: "seed-buyer-req-001",
      userId: guest.id,
      fsboListingId: fsboLiveGuest.id,
      assignedBrokerId: broker.id,
      budgetMinCents: 600_000_00,
      budgetMaxCents: 800_000_00,
      timeline: "60–90 days",
      preferences: "Plateau / Mile End, parking preferred (demo).",
    },
  });

  await prisma.immoContactLog.upsert({
    where: { id: "seed-immo-buyer-contact-001" },
    update: {},
    create: {
      id: "seed-immo-buyer-contact-001",
      userId: guest.id,
      targetUserId: host1.id,
      listingId: fsboHostBuyerTarget.id,
      listingKind: "fsbo",
      hub: "buyer",
      contactType: ImmoContactEventType.CONTACT_FORM_SUBMITTED,
      metadata: { demo: true, note: "Buyer Hub contact (demo)" },
    },
  });

  await prisma.brokerClient.upsert({
    where: { id: "seed-broker-client-demo-001" },
    update: {},
    create: {
      id: "seed-broker-client-demo-001",
      brokerId: broker.id,
      fullName: "Morgan Chen",
      email: "morgan.chen@example.com",
      phone: "+15145550199",
      status: "QUALIFIED",
      source: "demo_seed",
      targetCity: "Montreal",
      budgetMin: 400_000,
      budgetMax: 750_000,
      notes: "Pre-approved financing. Looking for Plateau / Mile End.",
    },
  });

  await prisma.brokerClient.upsert({
    where: { id: "seed-broker-client-demo-002" },
    update: {},
    create: {
      id: "seed-broker-client-demo-002",
      brokerId: broker.id,
      fullName: "Priya Nair",
      email: "priya.nair@example.com",
      phone: "+15145550200",
      status: "UNDER_CONTRACT",
      source: "demo_seed",
      targetCity: "Montreal",
      budgetMin: 500_000,
      budgetMax: 900_000,
      notes: "Offer accepted — financing + inspection milestones (demo).",
    },
  });

  await prisma.brokerClient.upsert({
    where: { id: "seed-broker-client-demo-003" },
    update: {},
    create: {
      id: "seed-broker-client-demo-003",
      brokerId: broker.id,
      fullName: "Alex Roy",
      email: "alex.roy@example.com",
      phone: "+15145550201",
      status: "LEAD",
      source: "demo_seed",
      targetCity: "Laval",
      budgetMin: 350_000,
      budgetMax: 550_000,
      notes: "New inquiry — follow up within 24h (demo).",
    },
  });

  const rentStart = new Date();
  rentStart.setUTCDate(1);
  rentStart.setUTCHours(12, 0, 0, 0);
  const rentEnd = new Date(rentStart);
  rentEnd.setUTCFullYear(rentEnd.getUTCFullYear() + 1);

  await prisma.rentalListing.upsert({
    where: { id: SEED_IDS.rentDemoListing },
    update: {},
    create: {
      id: SEED_IDS.rentDemoListing,
      listingCode: "REN-DEMO-001",
      landlordId: host1.id,
      title: "Modern 2BR — Longueuil (demo lease)",
      description:
        "Balcony, parking, near REM. This unit is part of the seeded long-term rent lifecycle (application → lease → rent).",
      priceMonthly: 195_000,
      depositAmount: 195_000,
      address: "99 Rue Saint-Charles O, Longueuil",
      city: "Longueuil",
      status: "RENTED",
    },
  });

  await prisma.rentalApplication.upsert({
    where: { id: SEED_IDS.rentDemoApp },
    update: {},
    create: {
      id: SEED_IDS.rentDemoApp,
      listingId: SEED_IDS.rentDemoListing,
      tenantId: guest.id,
      message:
        "Stable income, non-smoker. I would like to rent this unit starting on the first of the month (demo application).",
      status: "ACCEPTED",
      legalAcceptedAt: new Date(),
    },
  });

  await prisma.rentalLease.upsert({
    where: { id: SEED_IDS.rentDemoLease },
    update: {},
    create: {
      id: SEED_IDS.rentDemoLease,
      listingId: SEED_IDS.rentDemoListing,
      tenantId: guest.id,
      landlordId: host1.id,
      applicationId: SEED_IDS.rentDemoApp,
      startDate: rentStart,
      endDate: rentEnd,
      monthlyRent: 195_000,
      deposit: 195_000,
      status: "ACTIVE",
      signedAt: new Date(),
      contractText: DEFAULT_RENTAL_LEASE_CONTRACT,
    },
  });

  const due1 = new Date(rentStart);
  await prisma.rentPayment.upsert({
    where: { id: SEED_IDS.rentDemoPay },
    update: {},
    create: {
      id: SEED_IDS.rentDemoPay,
      leaseId: SEED_IDS.rentDemoLease,
      amount: 195_000,
      dueDate: due1,
      status: "PAID",
      paidAt: new Date(),
    },
  });

  await prisma.portfolioScenario.upsert({
    where: { id: "seed-investor-scenario-001" },
    update: {},
    create: {
      id: "seed-investor-scenario-001",
      userId: investor.id,
      title: "Montreal core — balanced growth",
      scenarioKind: "balanced",
      strategy: "Diversified residential in transit-served neighbourhoods.",
      totalBudgetCents: 1_200_000_00,
      totalDownPaymentCents: 240_000_00,
      projectedMonthlyCashFlowCents: 2_800_00,
      projectedAnnualCashFlowCents: 33_600_00,
      projectedAverageRoiPercent: 5.4,
      projectedAverageCapRate: 4.8,
      projectedRiskLevel: "medium",
    },
  });

  await prisma.mortgageRequest.upsert({
    where: { id: "seed-mortgage-demo-001" },
    update: {
      status: "approved",
      estimatedApprovalAmount: 520000,
      estimatedMonthlyPayment: 2800,
      approvalConfidence: "high",
    },
    create: {
      id: "seed-mortgage-demo-001",
      userId: guest.id,
      propertyPrice: 650000,
      downPayment: 130000,
      income: 140000,
      status: "approved",
      intentLevel: "high",
      timeline: "1-3 months",
      preApproved: true,
      estimatedApprovalAmount: 520000,
      estimatedMonthlyPayment: 2800,
      approvalConfidence: "high",
      fsboListingId: fsboLiveGuest.id,
    },
  });

  await prisma.investmentDeal.upsert({
    where: { id: "seed-inv-deal-001" },
    update: {},
    create: {
      id: "seed-inv-deal-001",
      userId: investor.id,
      rentalType: "LONG_TERM",
      propertyPrice: 450000,
      monthlyRent: 2200,
      monthlyExpenses: 1600,
      roiLongTerm: 8.2,
      roiShortTerm: 6.1,
      preferredStrategy: "LONG_TERM",
      roi: 8.2,
      riskScore: 28,
      rating: "Strong Buy",
      city: "Montreal",
      marketComparison: "Below Market",
    },
  });
  await prisma.investmentDeal.upsert({
    where: { id: "seed-inv-deal-002" },
    update: {},
    create: {
      id: "seed-inv-deal-002",
      userId: investor.id,
      rentalType: "LONG_TERM",
      propertyPrice: 520000,
      monthlyRent: 2400,
      monthlyExpenses: 2100,
      roiLongTerm: 4.5,
      roiShortTerm: 3.8,
      preferredStrategy: "LONG_TERM",
      roi: 4.5,
      riskScore: 44,
      rating: "Moderate Investment",
      city: "Laval",
      marketComparison: "Market Average",
    },
  });
  await prisma.investmentDeal.upsert({
    where: { id: "seed-inv-deal-003" },
    update: {},
    create: {
      id: "seed-inv-deal-003",
      userId: investor.id,
      rentalType: "LONG_TERM",
      propertyPrice: 680000,
      monthlyRent: 2600,
      monthlyExpenses: 2550,
      roiLongTerm: 2.1,
      roiShortTerm: 1.9,
      preferredStrategy: "LONG_TERM",
      roi: 2.1,
      riskScore: 62,
      rating: "High Risk",
      city: "Montreal",
      marketComparison: "Above Market",
    },
  });

  await prisma.portfolioScenarioItem.upsert({
    where: { id: "seed-psi-001" },
    update: {},
    create: {
      id: "seed-psi-001",
      scenarioId: "seed-investor-scenario-001",
      listingId: fsboLiveGuest.id,
      purchasePriceCents: 725_000_00,
      estimatedRentCents: 2800_00,
      projectedRoiPercent: 5.5,
      projectedCapRate: 4.2,
      projectedCashFlowCents: 1200_00,
      city: "Montreal",
      propertyType: "condo",
      riskLevel: "MEDIUM",
      strengthSummary: "Positive cash flow in balanced assumptions (demo).",
    },
  });
  await prisma.portfolioScenarioItem.upsert({
    where: { id: "seed-psi-002" },
    update: {},
    create: {
      id: "seed-psi-002",
      scenarioId: "seed-investor-scenario-001",
      listingId: fsboHostBuyerTarget.id,
      purchasePriceCents: 899_000_00,
      estimatedRentCents: 3100_00,
      projectedRoiPercent: 4.1,
      projectedCapRate: 3.9,
      projectedCashFlowCents: 400_00,
      city: "Montreal",
      propertyType: "rowhouse",
      riskLevel: "HIGH",
      strengthSummary: "Tighter margin — verify rent and capex (demo).",
    },
  });
  await prisma.portfolioScenarioItem.upsert({
    where: { id: "seed-psi-003" },
    update: {},
    create: {
      id: "seed-psi-003",
      scenarioId: "seed-investor-scenario-001",
      listingId: fsboDemo004.id,
      purchasePriceCents: 598_000_00,
      estimatedRentCents: 2400_00,
      projectedRoiPercent: 6.2,
      projectedCapRate: 5.1,
      projectedCashFlowCents: 1800_00,
      city: "Montreal",
      propertyType: "duplex",
      riskLevel: "LOW",
      strengthSummary: "Strongest demo line item on yield (estimate).",
    },
  });

  console.log(
    "  Demo-perfect: 5 FSBO seeds, buyer views+request, 3 broker clients, mortgage approved, 3 investment deals, scenario line items"
  );

  // ---------------------------------------------------------------------------
  // Market trend data (monthly snapshots — estimates for demo charts)
  // ---------------------------------------------------------------------------
  const existingMdp = await prisma.marketDataPoint.findFirst({
    where: { city: { equals: "Montreal", mode: "insensitive" } },
  });
  if (!existingMdp) {
    for (let i = 0; i < 18; i++) {
      const d = new Date();
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - (17 - i));
      const basePrice = 450_000 * 100;
      const baseRent = 2_200 * 100;
      await prisma.marketDataPoint.create({
        data: {
          city: "Montreal",
          propertyType: "Residential",
          avgPriceCents: Math.round(basePrice * (1 + i * 0.0025)),
          medianPriceCents: Math.round(basePrice * (1 + i * 0.002)),
          avgRentCents: Math.round(baseRent * (1 + i * 0.0015)),
          transactions: 110 + i * 2,
          inventory: 420 - i * 3,
          date: d,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // BNHub Marketing Engine (demo campaigns, EN/FR assets, internal publish)
  // ---------------------------------------------------------------------------
  const { seedBnhubMarketingDemo } = await import("./seed-bnhub-marketing");
  await seedBnhubMarketingDemo(SEED_IDS.host1);

  // ---------------------------------------------------------------------------
  // BNHub Autonomous Growth & Lead Engine (demo)
  // ---------------------------------------------------------------------------
  const { seedBnhubGrowthDemo } = await import("./seed-bnhub-growth");
  await seedBnhubGrowthDemo(SEED_IDS.host1);

  // ---------------------------------------------------------------------------
  // BNHub hospitality add-ons catalog (+ demo listing offers)
  // ---------------------------------------------------------------------------
  const { seedBnhubHospitalityCatalog } = await import("./seed-bnhub-hospitality-catalog");
  await seedBnhubHospitalityCatalog(SEED_IDS.listing1);
  const { seedBnhubHospitalityEcosystemV2 } = await import("./seed-bnhub-hospitality-ecosystem-v2");
  await seedBnhubHospitalityEcosystemV2();

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n--- Simulation seed complete ---");
  console.log("ADMIN LOGIN:");
  console.log("email: admin@demo.com");
  console.log("password: AdminDemo2024!");
  console.log(
    "Stripe checkout test: guest@demo.com / DemoGuest2024! → bookingId",
    SEED_IDS.bookingPendingCheckout,
    "(PENDING payment)"
  );
  console.log(
    "Sign-in: guest@demo.com / DemoGuest2024! · demo@platform.com & host*, broker, ambassador, investor / Demo123! (verified)"
  );
  console.log("BNHub: 4 listings, 4 bookings (confirmed/completed/pending/disputed), payments, review, dispute");
  console.log("Projects: 2 projects, units, favorite, alert, reservation, 2 leads");
  console.log("Referrals: program, referral code DEMO-REF-001, ambassador, commission");
  console.log("Transaction: 1 real estate transaction with offer and timeline");
  console.log("Trust & Safety: 2 incidents (1 under review with response, 1 resolved)");
  console.log("Billing: Host Pro plan, active subscription, paid invoice");
  console.log("Rent Hub: 1 listing · 1 application · 1 lease · 1 payment →", SEED_IDS.rentDemoListing);
}

