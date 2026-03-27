/**
 * Full connected demo dataset for CRM, listings, offers, contracts, documents,
 * intake, messaging, appointments, notifications, action queue, finance, and analytics.
 *
 * Usage (from apps/web):
 *   npx tsx scripts/generate-full-demo-data.ts
 *   DEMO_FULL_CLEAR=1 npx tsx scripts/generate-full-demo-data.ts   # replace existing demo-full rows
 *
 * Staging: `demo:reset` truncates the DB and re-runs prisma seed — run `npm run demo:full` after
 * if you want this dataset on staging (not part of cron reset).
 *
 * Requires DATABASE_URL. Loads `.env` from apps/web.
 */
import path from "node:path";
import { config } from "dotenv";
import {
  ActionQueueItemStatus,
  ActionQueueItemType,
  BrokerInteractionType,
  AppointmentEventType,
  AppointmentStatus,
  AppointmentType,
  BrokerClientStatus,
  ClientIntakeStatus,
  CommissionStatus,
  DocumentCategory,
  DocumentEventType,
  DocumentFileStatus,
  DocumentFolderType,
  DocumentVisibility,
  MeetingMode,
  MessageType,
  NotificationPriority,
  NotificationStatus,
  NotificationEventType,
  NotificationType,
  OfferEventType,
  OfferStatus,
  PaymentRecordStatus,
  PaymentRecordType,
  PlatformRole,
  RequiredDocumentCategory,
  RequiredDocumentStatus,
  TenantInvoiceStatus,
  TenantInvoiceType,
  TenantMembershipStatus,
  TenantRole,
  TenantStatus,
  UserEventType,
} from "@prisma/client";
import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth/password";
import { DEMO_ACCOUNT_EMAILS } from "../lib/demo/demo-account-constants";

const LEGACY_DEMO_EMAIL_SUFFIX = "@demo-full.example";

config({ path: path.join(__dirname, "../.env") });

/** Stable ids for idempotent re-runs when DEMO_FULL_CLEAR=1 */
const I = {
  tenantPrestige: "fulldemo-tenant-prestige",
  tenantUrban: "fulldemo-tenant-urban",
  /** Sarah Johnson — tenant owner, platform admin */
  ownerPrestige: "fulldemo-user-pr-owner",
  /** David Miller — primary listing broker (main demo story) */
  brokerPr1: "fulldemo-user-pr-br1",
  /** Emily Carter */
  brokerPr2: "fulldemo-user-pr-br2",
  /** Alex Nguyen — assistant */
  asstPrestige: "fulldemo-user-pr-asst",
  /** Lisa Brown — Urban admin */
  adminUrban: "fulldemo-user-ur-admin",
  /** James Wilson */
  brokerUrban: "fulldemo-user-ur-br",
  /** Michael Chen — buyer (Prestige) */
  client1: "fulldemo-user-client-1",
  /** Emma Wells — seller + Urban buyer flows */
  client2: "fulldemo-user-client-2",
} as const;

const SLUG_PRESTIGE = "prestige-realty-demo";
const SLUG_URBAN = "urban-property-advisors-demo";

const pwd = () => hashPassword(process.env.DEMO_FULL_PASSWORD?.trim() || "Demo123!");

async function clearDemoFullData(): Promise<void> {
  const tenants = await prisma.tenant.findMany({
    where: { slug: { in: [SLUG_PRESTIGE, SLUG_URBAN] } },
    select: { id: true },
  });
  const tenantIds = tenants.map((t) => t.id);
  if (tenantIds.length === 0) return;

  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [{ email: { in: [...DEMO_ACCOUNT_EMAILS] } }, { email: { endsWith: LEGACY_DEMO_EMAIL_SUFFIX } }],
    },
    select: { id: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);

  await prisma.$transaction(async (tx) => {
    await tx.tenant.updateMany({
      where: { id: { in: tenantIds } },
      data: { ownerUserId: null },
    });

    const notifIds = (
      await tx.notification.findMany({
        where: { tenantId: { in: tenantIds } },
        select: { id: true },
      })
    ).map((n) => n.id);
    const aqIds = (
      await tx.actionQueueItem.findMany({
        where: { tenantId: { in: tenantIds } },
        select: { id: true },
      })
    ).map((a) => a.id);
    if (notifIds.length) {
      await tx.notificationEvent.deleteMany({ where: { notificationId: { in: notifIds } } });
    }
    if (aqIds.length) {
      await tx.notificationEvent.deleteMany({ where: { actionQueueItemId: { in: aqIds } } });
    }
    await tx.notification.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.actionQueueItem.deleteMany({ where: { tenantId: { in: tenantIds } } });

    const convs = await tx.conversation.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { id: true },
    });
    const convIds = convs.map((c) => c.id);
    if (convIds.length) {
      await tx.messageEvent.deleteMany({ where: { conversationId: { in: convIds } } });
      await tx.message.deleteMany({ where: { conversationId: { in: convIds } } });
      await tx.conversationParticipant.deleteMany({ where: { conversationId: { in: convIds } } });
      await tx.conversation.deleteMany({ where: { id: { in: convIds } } });
    }

    await tx.documentEvent.deleteMany({
      where: { documentFile: { tenantId: { in: tenantIds } } },
    });
    await tx.documentAccessGrant.deleteMany({
      where: { documentFile: { tenantId: { in: tenantIds } } },
    });
    await tx.documentFile.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.documentFolder.deleteMany({ where: { tenantId: { in: tenantIds } } });

    await tx.clientIntakeEvent.deleteMany({
      where: { brokerClient: { tenantId: { in: tenantIds } } },
    });
    await tx.requiredDocumentItem.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.clientIntakeProfile.deleteMany({
      where: { tenantId: { in: tenantIds } },
    });

    await tx.appointmentEvent.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.appointment.deleteMany({ where: { tenantId: { in: tenantIds } } });

    await tx.offerEvent.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.offer.deleteMany({ where: { tenantId: { in: tenantIds } } });

    await tx.commissionSplit.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.paymentRecord.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.dealFinancial.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.tenantInvoice.deleteMany({ where: { tenantId: { in: tenantIds } } });

    await tx.contractSignature.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.contract.deleteMany({ where: { tenantId: { in: tenantIds } } });

    await tx.brokerClientInteraction.deleteMany({
      where: { brokerClient: { tenantId: { in: tenantIds } } },
    });
    await tx.brokerClientListing.deleteMany({
      where: { brokerClient: { tenantId: { in: tenantIds } } },
    });
    await tx.brokerClient.deleteMany({ where: { tenantId: { in: tenantIds } } });

    await tx.brokerListingAccess.deleteMany({
      where: { listing: { tenantId: { in: tenantIds } } },
    });
    await tx.listing.deleteMany({ where: { tenantId: { in: tenantIds } } });

    await tx.tenantMembership.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.tenantBillingProfile.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.tenant.deleteMany({ where: { id: { in: tenantIds } } });

    const deals = await tx.deal.findMany({
      where: {
        OR: [
          { buyerId: { in: demoUserIds } },
          { sellerId: { in: demoUserIds } },
          { brokerId: { in: demoUserIds } },
        ],
      },
      select: { id: true },
    });
    const dealIds = deals.map((d) => d.id);
    if (dealIds.length) {
      const payments = await tx.platformPayment.findMany({
        where: { dealId: { in: dealIds } },
        select: { id: true },
      });
      const payIds = payments.map((p) => p.id);
      if (payIds.length) {
        await tx.stripeLedgerEntry.deleteMany({ where: { platformPaymentId: { in: payIds } } });
        await tx.platformInvoice.deleteMany({ where: { paymentId: { in: payIds } } });
        await tx.brokerCommission.deleteMany({ where: { paymentId: { in: payIds } } });
        await tx.platformPayment.deleteMany({ where: { id: { in: payIds } } });
      }
      await tx.dealMilestone.deleteMany({ where: { dealId: { in: dealIds } } });
      await tx.dealDocument.deleteMany({ where: { dealId: { in: dealIds } } });
      await tx.deal.deleteMany({ where: { id: { in: dealIds } } });
    }

    await tx.userEvent.deleteMany({ where: { sessionId: { startsWith: "fulldemo-" } } });
    await tx.demoEvent.deleteMany({
      where: { OR: [{ userId: { in: demoUserIds } }, { event: "demo_walkthrough" }] },
    });

    await tx.user.deleteMany({ where: { id: { in: demoUserIds } } });
  });

  console.log("[demo-full] Cleared demo tenants, data, and demo account users.");
}

async function upsertUsers() {
  const h = await pwd();
  const users: Array<{
    id: string;
    email: string;
    name: string;
    role: PlatformRole;
    brokerStatus: "VERIFIED" | "NONE";
  }> = [
    { id: I.ownerPrestige, email: "sarah@prestige.demo", name: "Sarah Johnson", role: "ADMIN", brokerStatus: "VERIFIED" },
    { id: I.brokerPr1, email: "david@prestige.demo", name: "David Miller", role: "BROKER", brokerStatus: "VERIFIED" },
    { id: I.brokerPr2, email: "emily@prestige.demo", name: "Emily Carter", role: "BROKER", brokerStatus: "VERIFIED" },
    { id: I.asstPrestige, email: "alex@prestige.demo", name: "Alex Nguyen", role: "USER", brokerStatus: "NONE" },
    { id: I.adminUrban, email: "lisa@urban.demo", name: "Lisa Brown", role: "ADMIN", brokerStatus: "VERIFIED" },
    { id: I.brokerUrban, email: "james@urban.demo", name: "James Wilson", role: "BROKER", brokerStatus: "VERIFIED" },
    { id: I.client1, email: "michael@client.demo", name: "Michael Chen", role: "USER", brokerStatus: "NONE" },
    { id: I.client2, email: "emma@client.demo", name: "Emma Wells", role: "USER", brokerStatus: "NONE" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        email: u.email,
        name: u.name,
        role: u.role,
        brokerStatus: u.brokerStatus,
        accountStatus: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        brokerStatus: u.brokerStatus,
        accountStatus: "ACTIVE",
        passwordHash: h,
        emailVerifiedAt: new Date(),
        plan: "pro",
      },
    });
  }
}

async function upsertTenants() {
  await prisma.tenant.upsert({
    where: { id: I.tenantPrestige },
    update: {
      name: "Prestige Realty Group",
      slug: SLUG_PRESTIGE,
      status: TenantStatus.ACTIVE,
      ownerUserId: I.ownerPrestige,
    },
    create: {
      id: I.tenantPrestige,
      name: "Prestige Realty Group",
      slug: SLUG_PRESTIGE,
      status: TenantStatus.ACTIVE,
      ownerUserId: I.ownerPrestige,
      settings: { demoFull: true, region: "Montreal" },
    },
  });

  await prisma.tenant.upsert({
    where: { id: I.tenantUrban },
    update: {
      name: "Urban Property Advisors",
      slug: SLUG_URBAN,
      status: TenantStatus.ACTIVE,
      ownerUserId: I.adminUrban,
    },
    create: {
      id: I.tenantUrban,
      name: "Urban Property Advisors",
      slug: SLUG_URBAN,
      status: TenantStatus.ACTIVE,
      ownerUserId: I.adminUrban,
      settings: { demoFull: true, region: "Toronto" },
    },
  });

  const m = [
    { tenantId: I.tenantPrestige, userId: I.ownerPrestige, role: TenantRole.TENANT_OWNER },
    { tenantId: I.tenantPrestige, userId: I.brokerPr1, role: TenantRole.BROKER },
    { tenantId: I.tenantPrestige, userId: I.brokerPr2, role: TenantRole.BROKER },
    { tenantId: I.tenantPrestige, userId: I.asstPrestige, role: TenantRole.ASSISTANT },
    { tenantId: I.tenantPrestige, userId: I.client1, role: TenantRole.VIEWER },
    { tenantId: I.tenantPrestige, userId: I.client2, role: TenantRole.VIEWER },
    { tenantId: I.tenantUrban, userId: I.adminUrban, role: TenantRole.TENANT_ADMIN },
    { tenantId: I.tenantUrban, userId: I.brokerUrban, role: TenantRole.BROKER },
    { tenantId: I.tenantUrban, userId: I.client2, role: TenantRole.VIEWER },
  ] as const;

  for (const row of m) {
    await prisma.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: row.tenantId, userId: row.userId } },
      update: { role: row.role, status: TenantMembershipStatus.ACTIVE },
      create: {
        tenantId: row.tenantId,
        userId: row.userId,
        role: row.role,
        status: TenantMembershipStatus.ACTIVE,
      },
    });
  }

  await prisma.tenantBillingProfile.upsert({
    where: { tenantId: I.tenantPrestige },
    update: { legalName: "Prestige Realty Group Inc.", billingEmail: "billing@prestige.demo" },
    create: {
      tenantId: I.tenantPrestige,
      legalName: "Prestige Realty Group Inc.",
      billingEmail: "billing@prestige.demo",
      taxNumber: "GST 123456789",
    },
  });
}

type CreatedListing = { id: string; listingCode: string; title: string; price: number; brokerId: string };

async function seedListingsAndCrm(tenantId: string, brokerA: string, brokerB: string): Promise<{
  listings: CreatedListing[];
  clients: { id: string; fullName: string }[];
}> {
  /** Distinct codes: both tenant ids start with `fulldemo-tenant-…` so slice(0,4) would collide. */
  const p = tenantId === I.tenantPrestige ? "PRST" : tenantId === I.tenantUrban ? "URBN" : tenantId.slice(0, 4);
  const listingSeeds: { code: string; title: string; price: number; brokerId: string }[] = [
    { code: `FDEMO-${p}-001`, title: "Luxury Condo Downtown (active)", price: 750_000, brokerId: brokerA },
    { code: `FDEMO-${p}-002`, title: "Waterfront Townhouse (under negotiation)", price: 1_150_000, brokerId: brokerA },
    { code: `FDEMO-${p}-003`, title: "Modern Loft Plateau (active)", price: 625_000, brokerId: brokerB },
    { code: `FDEMO-${p}-004`, title: "Family Home Laval (sold)", price: 789_000, brokerId: brokerB },
    { code: `FDEMO-${p}-005`, title: "Penthouse with Terrace (under negotiation)", price: 1_995_000, brokerId: brokerA },
    { code: `FDEMO-${p}-006`, title: "Brick Triplex Investment (active)", price: 1_120_000, brokerId: brokerB },
    { code: `FDEMO-${p}-007`, title: "Heritage Duplex (active)", price: 925_000, brokerId: brokerA },
    { code: `FDEMO-${p}-008`, title: "Lakeview Bungalow (sold)", price: 698_000, brokerId: brokerB },
  ];

  const listings: CreatedListing[] = [];
  for (const L of listingSeeds) {
    const row = await prisma.listing.create({
      data: {
        listingCode: L.code,
        title: L.title,
        price: L.price,
        tenantId,
        ownerId: L.brokerId,
      },
    });
    await prisma.brokerListingAccess.create({
      data: { listingId: row.id, brokerId: L.brokerId, role: "owner" },
    });
    listings.push({
      id: row.id,
      listingCode: row.listingCode,
      title: row.title,
      price: L.price,
      brokerId: L.brokerId,
    });
  }

  const clientNames = [
    ...(tenantId === I.tenantPrestige ? ["Michael Chen"] : ["Emma Wells"]),
    "Lucas Girard",
    "Nadia Rahman",
    "Tomislav Petrov",
    "Yuki Tanaka",
    "Olivia Price",
    "Hassan El-Amin",
    "Claire Bélanger",
    "Diego Morales",
    "Anna Kowalski",
    "Robert Singh",
    "Julia Meyer",
    "Marc-André Veilleux",
    "Priya Nair",
    "Stefan Lindberg",
  ];
  const statuses: BrokerClientStatus[] = [
    "LEAD",
    "CONTACTED",
    "QUALIFIED",
    "VIEWING",
    "NEGOTIATING",
    "UNDER_CONTRACT",
    "CLOSED",
    "LOST",
    "LEAD",
    "QUALIFIED",
    "VIEWING",
    "NEGOTIATING",
    "CONTACTED",
    "QUALIFIED",
    "VIEWING",
  ];

  const clients: { id: string; fullName: string }[] = [];
  let bi = 0;
  for (let i = 0; i < clientNames.length; i++) {
    const brokerId = i % 2 === 0 ? brokerA : brokerB;
    const bc = await prisma.brokerClient.create({
      data: {
        brokerId,
        tenantId,
        fullName: clientNames[i]!,
        email: `crm.${tenantId === I.tenantPrestige ? "prestige" : "urban"}.${i}@client.demo`,
        phone: `514-555-${String(2000 + i).padStart(4, "0")}`,
        status: statuses[i]!,
        source: "referral",
        targetCity: tenantId === I.tenantPrestige ? "Montreal" : "Toronto",
      },
    });
    clients.push({ id: bc.id, fullName: bc.fullName });
    await prisma.brokerClientInteraction.create({
      data: {
        brokerClientId: bc.id,
        actorId: brokerId,
        type: BrokerInteractionType.NOTE,
        title: "Intro call",
        message: "Discussed budget and preferred neighborhoods.",
      },
    });
    if (i === 0) {
      const dueStart = new Date();
      dueStart.setHours(10, 0, 0, 0);
      await prisma.brokerClientInteraction.create({
        data: {
          brokerClientId: bc.id,
          actorId: brokerId,
          type: BrokerInteractionType.TASK,
          title: "Financing check-in — Luxury Condo",
          message: "Confirm mortgage pre-approval status with buyer.",
          dueAt: dueStart,
          completedAt: null,
        },
      });
    }
    if (listings[bi]) {
      await prisma.brokerClientListing.create({
        data: {
          brokerClientId: bc.id,
          listingId: listings[bi]!.id,
          kind: i % 3 === 0 ? "FAVORITE" : "SAVED",
        },
      });
      bi = (bi + 1) % listings.length;
    }
  }

  return { listings, clients };
}

async function seedListingDealRoom(
  tenantId: string,
  listingId: string,
  brokerId: string,
  offerIdForFile: string,
) {
  const folder = await prisma.documentFolder.create({
    data: {
      tenantId,
      listingId,
      name: "Deal room",
      type: DocumentFolderType.LISTING_ROOM,
      createdById: brokerId,
    },
  });
  const mk = (name: string, cat: DocumentCategory) =>
    prisma.documentFile.create({
      data: {
        tenantId,
        folderId: folder.id,
        listingId,
        offerId: offerIdForFile,
        uploadedById: brokerId,
        fileName: name,
        originalName: name,
        mimeType: "application/pdf",
        sizeBytes: 240_000,
        storageKey: `demo-full/${tenantId}/listing/${listingId}/${name}`,
        status: DocumentFileStatus.AVAILABLE,
        visibility: DocumentVisibility.SHARED_PARTICIPANTS,
        category: cat,
      },
    });
  await mk("Offer.pdf", DocumentCategory.CONTRACT);
  await mk("Contract.pdf", DocumentCategory.CONTRACT);
}

/** Schema has no ContractEvent; we record contract-related activity via DocumentEvent on contract files. */
async function seedContractDocumentTrail(args: {
  tenantId: string;
  contractId: string;
  listingId: string;
  offerId: string;
  brokerId: string;
}) {
  const { tenantId, contractId, listingId, offerId, brokerId } = args;
  const folder = await prisma.documentFolder.create({
    data: {
      tenantId,
      listingId,
      contractId,
      name: "Contract package",
      type: DocumentFolderType.CONTRACT_ROOM,
      createdById: brokerId,
    },
  });
  const mkFile = async (name: string) => {
    const f = await prisma.documentFile.create({
      data: {
        tenantId,
        folderId: folder.id,
        listingId,
        offerId,
        contractId,
        uploadedById: brokerId,
        fileName: name,
        originalName: name,
        mimeType: "application/pdf",
        sizeBytes: 180_000,
        storageKey: `demo-full/${tenantId}/contract/${contractId}/${name}`,
        status: DocumentFileStatus.AVAILABLE,
        visibility: DocumentVisibility.SHARED_PARTICIPANTS,
        category: DocumentCategory.CONTRACT,
      },
    });
    await prisma.documentEvent.create({
      data: {
        documentFileId: f.id,
        folderId: folder.id,
        actorId: brokerId,
        type: DocumentEventType.FILE_UPLOADED,
        message: `${name} added to deal room`,
      },
    });
  };
  await mkFile("Offer.pdf");
  await mkFile("Contract.pdf");
}

async function seedOffersContractsFinance(args: {
  tenantId: string;
  listings: CreatedListing[];
  clients: { id: string }[];
  buyerUserId: string;
  brokerId: string;
  buyerEmail: string;
  brokerEmail: string;
}) {
  const { tenantId, listings, clients, buyerUserId, brokerId, buyerEmail, brokerEmail } = args;
  /** Both fixed tenant ids normalize to the same 10-char prefix — invoice_number is globally unique. */
  const invPrefix =
    tenantId === I.tenantPrestige
      ? "PRSTDEMO"
      : tenantId === I.tenantUrban
        ? "URBDEMO"
        : tenantId.replace(/[^a-z0-9]/gi, "").slice(0, 10).toUpperCase();
  const lix = listings.slice(0, 3);
  for (let i = 0; i < lix.length; i++) {
    const L = lix[i]!;
    const offer1 = await prisma.offer.create({
      data: {
        listingId: L.id,
        buyerId: buyerUserId,
        brokerId,
        tenantId,
        status:
          i === 0 ? OfferStatus.ACCEPTED : i === 1 ? OfferStatus.COUNTERED : OfferStatus.UNDER_REVIEW,
        offeredPrice: L.price * (i === 1 ? 0.97 : 0.99),
        downPaymentAmount: L.price * 0.1,
        financingNeeded: true,
        message: "Formal offer with standard conditions.",
      },
    });
    await prisma.offerEvent.createMany({
      data: [
        { offerId: offer1.id, tenantId, actorId: buyerUserId, type: OfferEventType.SUBMITTED, message: "Offer submitted" },
        { offerId: offer1.id, tenantId, actorId: brokerId, type: OfferEventType.STATUS_CHANGED, message: `Status: ${offer1.status}` },
      ],
    });

    const offer2 = await prisma.offer.create({
      data: {
        listingId: L.id,
        buyerId: buyerUserId,
        brokerId,
        tenantId,
        status: i === 2 ? OfferStatus.REJECTED : OfferStatus.SUBMITTED,
        offeredPrice: L.price * 0.96,
        message: i === 2 ? "Declined backup — below threshold." : "Backup offer.",
      },
    });
    await prisma.offerEvent.createMany({
      data: [
        {
          offerId: offer2.id,
          tenantId,
          actorId: buyerUserId,
          type: OfferEventType.CREATED,
          message: "Draft created",
        },
        ...(i === 2
          ? [
              {
                offerId: offer2.id,
                tenantId,
                actorId: brokerId,
                type: OfferEventType.REJECTED,
                message: "Rejected — terms not acceptable",
              },
            ]
          : []),
      ],
    });

    if (i === 0) {
      const contract = await prisma.contract.create({
        data: {
          type: "listing_contract",
          userId: brokerId,
          tenantId,
          title: `Purchase — ${L.title}`,
          contentHtml: `<p>Agreement for ${L.listingCode}</p>`,
          status: "signed",
          signedAt: new Date(),
          hub: "realestate",
        },
      });
      await prisma.contractSignature.createMany({
        data: [
          {
            contractId: contract.id,
            tenantId,
            userId: buyerUserId,
            name: "Buyer",
            email: buyerEmail,
            role: "tenant",
            signedAt: new Date(),
          },
          {
            contractId: contract.id,
            tenantId,
            userId: brokerId,
            name: "Broker",
            email: brokerEmail,
            role: "broker",
            signedAt: new Date(),
          },
        ],
      });

      await seedContractDocumentTrail({
        tenantId,
        contractId: contract.id,
        listingId: L.id,
        offerId: offer1.id,
        brokerId,
      });

      const df = await prisma.dealFinancial.create({
        data: {
          tenantId,
          listingId: L.id,
          offerId: offer1.id,
          contractId: contract.id,
          salePrice: L.price,
          commissionRate: 0.025,
          grossCommission: L.price * 0.025,
          netCommission: L.price * 0.02,
          currency: "CAD",
        },
      });
      await prisma.commissionSplit.createMany({
        data: [
          {
            tenantId,
            dealFinancialId: df.id,
            userId: brokerId,
            roleLabel: "Listing agent",
            percent: 60,
            amount: df.grossCommission! * 0.6,
            status: CommissionStatus.APPROVED,
          },
          {
            tenantId,
            dealFinancialId: df.id,
            userId: brokerId,
            roleLabel: "Co-op",
            percent: 40,
            amount: df.grossCommission! * 0.4,
            status: CommissionStatus.PENDING,
          },
        ],
      });

      const inv = await prisma.tenantInvoice.create({
        data: {
          tenantId,
          invoiceNumber: `INV-${invPrefix}-001`,
          type: TenantInvoiceType.COMMISSION,
          status: TenantInvoiceStatus.PAID,
          clientName: "Buyer (demo)",
          clientEmail: buyerEmail,
          lineItems: [{ description: "Commission — first tranche", amount: df.grossCommission! * 0.5, qty: 1 }],
          subtotal: df.grossCommission! * 0.5,
          taxAmount: 0,
          totalAmount: df.grossCommission! * 0.5,
          currency: "CAD",
          issuedAt: new Date(),
          paidAt: new Date(),
          dueAt: new Date(),
          listingId: L.id,
          offerId: offer1.id,
          contractId: contract.id,
          brokerClientId: clients[0]?.id,
          createdById: brokerId,
        },
      });

      const inv2 = await prisma.tenantInvoice.create({
        data: {
          tenantId,
          invoiceNumber: `INV-${invPrefix}-002`,
          type: TenantInvoiceType.SERVICE_FEE,
          status: TenantInvoiceStatus.OVERDUE,
          clientName: "Staging services",
          clientEmail: "vendor@prestige.demo",
          lineItems: [{ description: "Staging invoice", amount: 2500, qty: 1 }],
          subtotal: 2500,
          taxAmount: 0,
          totalAmount: 2500,
          currency: "CAD",
          issuedAt: new Date(),
          dueAt: new Date(Date.now() - 86400000 * 7),
          listingId: L.id,
          createdById: brokerId,
        },
      });

      await prisma.tenantInvoice.create({
        data: {
          tenantId,
          invoiceNumber: `INV-${invPrefix}-DRAFT`,
          type: TenantInvoiceType.COMMISSION,
          status: TenantInvoiceStatus.DRAFT,
          clientName: "Draft — co-broker share",
          clientEmail: buyerEmail,
          lineItems: [{ description: "Commission split (draft)", amount: 1200, qty: 1 }],
          subtotal: 1200,
          taxAmount: 0,
          totalAmount: 1200,
          currency: "CAD",
          listingId: L.id,
          createdById: brokerId,
        },
      });

      await prisma.tenantInvoice.create({
        data: {
          tenantId,
          invoiceNumber: `INV-${invPrefix}-003`,
          type: TenantInvoiceType.SERVICE_FEE,
          status: TenantInvoiceStatus.ISSUED,
          clientName: "Photography package",
          clientEmail: "photos@prestige.demo",
          lineItems: [{ description: "Listing photos", amount: 450, qty: 1 }],
          subtotal: 450,
          taxAmount: 0,
          totalAmount: 450,
          currency: "CAD",
          issuedAt: new Date(),
          dueAt: new Date(Date.now() + 86400000 * 5),
          listingId: L.id,
          createdById: brokerId,
        },
      });

      await prisma.paymentRecord.createMany({
        data: [
          {
            tenantId,
            tenantInvoiceId: inv.id,
            dealFinancialId: df.id,
            type: PaymentRecordType.INCOMING,
            status: PaymentRecordStatus.SUCCEEDED,
            amount: inv.totalAmount,
            provider: "manual",
            paidByName: "Buyer",
          },
          {
            tenantId,
            tenantInvoiceId: inv2.id,
            type: PaymentRecordType.OUTGOING,
            status: PaymentRecordStatus.PENDING,
            amount: inv2.totalAmount,
            provider: "future_adapter",
            notes: "Awaiting wire",
          },
        ],
      });
    }

    if (i === 1) {
      const pending = await prisma.contract.create({
        data: {
          type: "listing_contract",
          userId: brokerId,
          tenantId,
          title: `Pending PSA — ${L.title}`,
          contentHtml: `<p>Awaiting signatures for ${L.listingCode}</p>`,
          status: "pending",
          hub: "realestate",
        },
      });
      await prisma.contractSignature.createMany({
        data: [
          {
            contractId: pending.id,
            tenantId,
            userId: buyerUserId,
            name: "Buyer",
            email: buyerEmail,
            role: "tenant",
            signedAt: null,
          },
          {
            contractId: pending.id,
            tenantId,
            userId: brokerId,
            name: "Broker",
            email: brokerEmail,
            role: "broker",
            signedAt: null,
          },
        ],
      });
      await seedContractDocumentTrail({
        tenantId,
        contractId: pending.id,
        listingId: L.id,
        offerId: offer1.id,
        brokerId,
      });
    }

    if (i === 2) {
      const partial = await prisma.contract.create({
        data: {
          type: "listing_contract",
          userId: brokerId,
          tenantId,
          title: `PSA — buyer signed · broker pending (${L.listingCode})`,
          contentHtml: `<p>Partially executed agreement for ${L.title}</p>`,
          status: "pending",
          hub: "realestate",
        },
      });
      await prisma.contractSignature.createMany({
        data: [
          {
            contractId: partial.id,
            tenantId,
            userId: buyerUserId,
            name: "Buyer",
            email: buyerEmail,
            role: "tenant",
            signedAt: new Date(),
          },
          {
            contractId: partial.id,
            tenantId,
            userId: brokerId,
            name: "Broker",
            email: brokerEmail,
            role: "broker",
            signedAt: null,
          },
        ],
      });
    }
  }
}

async function seedIntakeAndDocs(
  tenantId: string,
  brokerId: string,
  clients: { id: string }[],
  city: string,
  linkedClientUserId: string | null,
) {
  for (let i = 0; i < Math.min(4, clients.length); i++) {
    const bc = clients[i]!;
    const profile = await prisma.clientIntakeProfile.create({
      data: {
        tenantId,
        brokerClientId: bc.id,
        userId: i === 0 ? linkedClientUserId : null,
        legalFirstName: i === 0 ? (tenantId === I.tenantPrestige ? "Michael" : "Emma") : "Demo",
        legalLastName: i === 0 ? (tenantId === I.tenantPrestige ? "Chen" : "Wells") : "Client",
        status:
          i === 0
            ? ClientIntakeStatus.UNDER_REVIEW
            : i === 3
              ? ClientIntakeStatus.COMPLETE
              : ClientIntakeStatus.IN_PROGRESS,
        city,
        provinceState: city === "Toronto" ? "ON" : "QC",
      },
    });

    const docs: { title: string; cat: RequiredDocumentCategory; st: RequiredDocumentStatus }[] =
      i === 3
        ? [
            { title: "Government ID", cat: "IDENTITY", st: "APPROVED" },
            { title: "Proof of income", cat: "INCOME", st: "APPROVED" },
          ]
        : [
            { title: "Government ID", cat: "IDENTITY", st: "APPROVED" },
            { title: "Proof of income", cat: "INCOME", st: i === 1 ? "UNDER_REVIEW" : "UPLOADED" },
            { title: "Bank statements", cat: "BANKING", st: "REQUESTED" },
            ...(i === 2 ? ([{ title: "Credit report", cat: "CREDIT" as const, st: "REJECTED" as const }] as const) : []),
          ];

    for (const d of docs) {
      const folder = await prisma.documentFolder.create({
        data: {
          tenantId,
          name: `Intake — ${d.title}`,
          type: DocumentFolderType.CLIENT_ROOM,
          brokerClientId: bc.id,
          createdById: brokerId,
        },
      });
      const file = await prisma.documentFile.create({
        data: {
          tenantId,
          folderId: folder.id,
          brokerClientId: bc.id,
          uploadedById: brokerId,
          fileName: d.title.includes("ID") ? "ID.pdf" : d.title.includes("income") ? "Proof_of_income.pdf" : "Banking.pdf",
          originalName: d.title.includes("ID") ? "ID.pdf" : "Proof_of_income.pdf",
          mimeType: "application/pdf",
          sizeBytes: 120_000 + i * 1000,
          storageKey: `demo-full/${tenantId}/intake/${bc.id}/${d.title.replace(/\s+/g, "_")}.pdf`,
          status: DocumentFileStatus.AVAILABLE,
          visibility: DocumentVisibility.CLIENT_VISIBLE,
          category: DocumentCategory.IDENTITY,
        },
      });
      await prisma.requiredDocumentItem.create({
        data: {
          tenantId,
          brokerClientId: bc.id,
          intakeProfileId: profile.id,
          title: d.title,
          category: d.cat,
          status: d.st,
          requestedById: brokerId,
          linkedDocumentFileId: d.st === "REQUESTED" ? null : file.id,
          reviewedById: d.st === "APPROVED" || d.st === "REJECTED" ? brokerId : null,
          rejectionReason: d.st === "REJECTED" ? "Please upload a clearer, full-page scan." : undefined,
        },
      });
    }
  }
}

async function seedMessaging(
  tenantId: string,
  brokerId: string,
  assistantId: string,
  clientUserId: string,
  listingId: string,
) {
  const c1 = await prisma.conversation.create({
    data: {
      tenantId,
      listingId,
      type: "CLIENT_THREAD",
      subject: "Luxury Condo — offer timeline",
      createdById: brokerId,
      participants: {
        create: [
          { userId: brokerId, roleLabel: "broker" },
          { userId: clientUserId, roleLabel: "client" },
        ],
      },
    },
  });
  const msgs = [
    "Hi Michael — sending the updated comparables for the downtown condo.",
    "Thanks Sarah, can we review financing conditions tomorrow?",
    "Absolutely — I’ll block 30 minutes after the showing.",
    "Perfect — I’ll bring the updated pre-approval letter.",
  ];
  for (let i = 0; i < msgs.length; i++) {
    await prisma.message.create({
      data: {
        tenantId,
        conversationId: c1.id,
        senderId: i % 2 === 0 ? brokerId : clientUserId,
        body: msgs[i]!,
        messageType: MessageType.TEXT,
      },
    });
  }
  const ordered = await prisma.message.findMany({
    where: { conversationId: c1.id },
    orderBy: { createdAt: "asc" },
  });
  const lastMsg = ordered[ordered.length - 1];
  await prisma.conversation.update({
    where: { id: c1.id },
    data: { lastMessageAt: lastMsg?.createdAt ?? new Date() },
  });
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: c1.id, userId: brokerId } },
    data: {
      lastReadAt: ordered[2]?.createdAt ?? null,
    },
  });

  const c2 = await prisma.conversation.create({
    data: {
      tenantId,
      listingId,
      type: "DIRECT",
      subject: "Internal — Luxury Condo checklist",
      createdById: brokerId,
      participants: {
        create: [
          { userId: brokerId, roleLabel: "broker" },
          { userId: assistantId, roleLabel: "assistant" },
        ],
      },
    },
  });
  for (let i = 0; i < 5; i++) {
    await prisma.message.create({
      data: {
        tenantId,
        conversationId: c2.id,
        senderId: i % 2 === 0 ? brokerId : assistantId,
        body: `Internal note ${i + 1}: follow up on documents.`,
        messageType: MessageType.TEXT,
      },
    });
  }
  const last2 = await prisma.message.findFirst({
    where: { conversationId: c2.id },
    orderBy: { createdAt: "desc" },
  });
  await prisma.conversation.update({
    where: { id: c2.id },
    data: { lastMessageAt: last2?.createdAt ?? new Date() },
  });
}

async function seedAppointments(tenantId: string, brokerId: string, clientUserId: string, listingId: string) {
  const base = Date.now();
  const rows = [
    {
      title: "Property visit — Luxury Condo",
      type: AppointmentType.PROPERTY_VISIT,
      status: AppointmentStatus.CONFIRMED,
      startsAt: new Date(base + 86400000),
      endsAt: new Date(base + 86400000 + 3600000),
    },
    {
      title: "Offer discussion call",
      type: AppointmentType.OFFER_DISCUSSION,
      status: AppointmentStatus.PENDING,
      startsAt: new Date(base + 172800000),
      endsAt: new Date(base + 172800000 + 2700000),
    },
    {
      title: "Contract signing",
      type: AppointmentType.CONTRACT_SIGNING,
      status: AppointmentStatus.COMPLETED,
      startsAt: new Date(base - 86400000 * 3),
      endsAt: new Date(base - 86400000 * 3 + 3600000),
    },
  ];
  for (const r of rows) {
    const a = await prisma.appointment.create({
      data: {
        tenantId,
        brokerId,
        clientUserId,
        listingId,
        type: r.type,
        status: r.status,
        title: r.title,
        startsAt: r.startsAt,
        endsAt: r.endsAt,
        meetingMode: MeetingMode.IN_PERSON,
        requestedById: clientUserId,
        confirmedAt: r.status === AppointmentStatus.CONFIRMED ? new Date() : null,
      },
    });
    await prisma.appointmentEvent.create({
      data: {
        appointmentId: a.id,
        tenantId,
        actorId: brokerId,
        type:
          r.status === AppointmentStatus.COMPLETED
            ? AppointmentEventType.COMPLETED
            : AppointmentEventType.CONFIRMED,
        message: "Status updated (demo)",
      },
    });
  }
}

async function logNotificationCreatedEvents(tenantId: string, brokerId: string) {
  const rows = await prisma.notification.findMany({
    where: { tenantId, userId: brokerId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, title: true },
  });
  for (const n of rows) {
    await prisma.notificationEvent.create({
      data: {
        notificationId: n.id,
        type: NotificationEventType.CREATED,
        message: n.title,
      },
    });
  }
}

async function seedNotificationsAndTasks(
  tenantId: string,
  brokerId: string,
  listingId: string,
  clientFirstName: string,
) {
  await prisma.notification.createMany({
    data: [
      {
        tenantId,
        userId: brokerId,
        type: NotificationType.MESSAGE,
        title: "New message from client",
        message: "Unread thread — offer timeline",
        status: NotificationStatus.UNREAD,
        priority: NotificationPriority.NORMAL,
        actionUrl: "/dashboard/messages",
        actionLabel: "Open inbox",
      },
      {
        tenantId,
        userId: brokerId,
        type: NotificationType.OFFER,
        title: "Offer submitted",
        message: "A new offer needs your review.",
        status: NotificationStatus.UNREAD,
        listingId,
      },
      {
        tenantId,
        userId: brokerId,
        type: NotificationType.CONTRACT,
        title: "Contract ready to sign",
        message: "Purchase agreement is pending signatures.",
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
      {
        tenantId,
        userId: brokerId,
        type: NotificationType.DOCUMENT,
        title: "Document uploaded",
        message: "Proof of income received.",
        status: NotificationStatus.UNREAD,
      },
      {
        tenantId,
        userId: brokerId,
        type: NotificationType.APPOINTMENT,
        title: "Appointment requested",
        message: "Client requested a showing.",
        status: NotificationStatus.UNREAD,
      },
    ],
  });

  await prisma.actionQueueItem.createMany({
    data: [
      {
        tenantId,
        userId: brokerId,
        type: ActionQueueItemType.REVIEW_OFFER,
        title: "Review latest offer",
        status: ActionQueueItemStatus.OPEN,
        priority: NotificationPriority.URGENT,
        actionUrl: "/dashboard/broker/offers",
      },
      {
        tenantId,
        userId: brokerId,
        type: ActionQueueItemType.SIGN_CONTRACT,
        title: "Sign listing agreement",
        status: ActionQueueItemStatus.OPEN,
        priority: NotificationPriority.HIGH,
        actionUrl: "/dashboard/contracts",
      },
      {
        tenantId,
        userId: brokerId,
        type: ActionQueueItemType.RESPOND_MESSAGE,
        title: `Reply to ${clientFirstName}`,
        status: ActionQueueItemStatus.OPEN,
        priority: NotificationPriority.HIGH,
        actionUrl: "/dashboard/messages",
      },
      {
        tenantId,
        userId: brokerId,
        type: ActionQueueItemType.UPLOAD_REQUIRED_DOCUMENT,
        title: "Upload missing KYC item",
        status: ActionQueueItemStatus.OPEN,
        priority: NotificationPriority.NORMAL,
        actionUrl: "/dashboard/broker/intake",
      },
      {
        tenantId,
        userId: brokerId,
        type: ActionQueueItemType.CONFIRM_APPOINTMENT,
        title: "Confirm property visit",
        status: ActionQueueItemStatus.OPEN,
        priority: NotificationPriority.NORMAL,
        dueAt: new Date(Date.now() + 86400000),
        actionUrl: "/dashboard/appointments",
      },
      {
        tenantId,
        userId: brokerId,
        type: ActionQueueItemType.FOLLOW_UP_OVERDUE_INVOICE,
        title: "Follow up overdue invoice",
        status: ActionQueueItemStatus.OPEN,
        priority: NotificationPriority.LOW,
        actionUrl: "/dashboard/billing",
      },
    ],
  });

  await logNotificationCreatedEvents(tenantId, brokerId);
}

async function seedDealsForUser() {
  const d1 = await prisma.deal.create({
    data: {
      buyerId: I.client1,
      sellerId: I.client2,
      brokerId: I.brokerPr1,
      priceCents: 750_000_00,
      status: "accepted",
      crmStage: "negotiation",
    },
  });
  await prisma.dealMilestone.createMany({
    data: [
      { dealId: d1.id, name: "Deposit", status: "completed", completedAt: new Date() },
      { dealId: d1.id, name: "Inspection", status: "pending", dueDate: new Date(Date.now() + 86400000 * 5) },
    ],
  });
  await prisma.dealDocument.create({
    data: {
      dealId: d1.id,
      type: "contract",
      fileUrl: `s3://demo-full/deals/${d1.id}/contract.pdf`,
      status: "uploaded",
    },
  });

  const payClosed = await prisma.platformPayment.create({
    data: {
      userId: I.client1,
      dealId: d1.id,
      paymentType: "closing_fee",
      amountCents: 12_000_00,
      status: "paid",
    },
  });
  await prisma.brokerCommission.create({
    data: {
      paymentId: payClosed.id,
      brokerId: I.brokerPr1,
      grossAmountCents: 12_000_00,
      brokerAmountCents: 8400_00,
      platformAmountCents: 3600_00,
      status: "paid",
      paidAt: new Date(),
    },
  });

  const payPending = await prisma.platformPayment.create({
    data: {
      userId: I.client1,
      dealId: d1.id,
      paymentType: "deposit",
      amountCents: 5000_00,
      status: "pending",
    },
  });
  await prisma.brokerCommission.create({
    data: {
      paymentId: payPending.id,
      brokerId: I.brokerPr1,
      grossAmountCents: 5000_00,
      brokerAmountCents: 3500_00,
      platformAmountCents: 1500_00,
      status: "pending",
    },
  });
}

async function seedAnalytics() {
  const types = [
    UserEventType.VISIT_PAGE,
    UserEventType.ANALYZE,
    UserEventType.SAVE_DEAL,
    UserEventType.COMPARE,
    UserEventType.RETURN_VISIT,
  ];
  const dayMs = 86400000;
  for (let d = 0; d < 14; d++) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - d);
    await prisma.platformAnalytics.upsert({
      where: { date },
      update: {
        visitors: 20 + d * 3,
        listingsBroker: 5 + (d % 4),
        listingsSelf: 2,
        transactionsClosed: d % 5,
      },
      create: {
        date,
        visitors: 20 + d * 3,
        listingsBroker: 5 + (d % 4),
        listingsSelf: 2,
        transactionsClosed: d % 5,
      },
    });
    for (const t of types) {
      const createdAt = new Date(date);
      createdAt.setUTCHours(14, 30, 0, 0);
      await prisma.userEvent.create({
        data: {
          eventType: t,
          metadata: { demoFull: true, day: d },
          sessionId: `fulldemo-${d}-${t}-${createdAt.getTime()}`,
          createdAt,
        },
      });
    }
  }

  await prisma.demoEvent.createMany({
    data: [
      { userId: I.brokerPr1, event: "offer_submitted", metadata: { demoFull: true } },
      { userId: I.brokerPr1, event: "contract_signed", metadata: { demoFull: true } },
      { event: "demo_walkthrough", metadata: { demoFull: true, step: "finance" } },
    ],
  });
}

async function main() {
  const existing = await prisma.tenant.findUnique({ where: { slug: SLUG_PRESTIGE } });
  const shouldClear = process.env.DEMO_FULL_CLEAR === "1" || process.env.DEMO_FULL_CLEAR === "true";
  if (existing && !shouldClear) {
    console.log(
      `[demo-full] Tenants ${SLUG_PRESTIGE} / ${SLUG_URBAN} already exist. Set DEMO_FULL_CLEAR=1 to replace, or run with clear first.`,
    );
    return;
  }
  if (shouldClear) {
    await clearDemoFullData();
  }

  await upsertUsers();
  await upsertTenants();

  const pr = await seedListingsAndCrm(I.tenantPrestige, I.brokerPr1, I.brokerPr2);
  const ur = await seedListingsAndCrm(I.tenantUrban, I.brokerUrban, I.brokerUrban);

  await seedOffersContractsFinance({
    tenantId: I.tenantPrestige,
    listings: pr.listings,
    clients: pr.clients,
    buyerUserId: I.client1,
    brokerId: I.brokerPr1,
    buyerEmail: "michael@client.demo",
    brokerEmail: "david@prestige.demo",
  });
  await seedOffersContractsFinance({
    tenantId: I.tenantUrban,
    listings: ur.listings,
    clients: ur.clients,
    buyerUserId: I.client2,
    brokerId: I.brokerUrban,
    buyerEmail: "emma@client.demo",
    brokerEmail: "james@urban.demo",
  });

  const firstPrestigeOffer = await prisma.offer.findFirst({
    where: { tenantId: I.tenantPrestige, listingId: pr.listings[0]?.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (pr.listings[0] && firstPrestigeOffer) {
    await seedListingDealRoom(I.tenantPrestige, pr.listings[0].id, I.brokerPr1, firstPrestigeOffer.id);
  }
  const firstUrbanOffer = await prisma.offer.findFirst({
    where: { tenantId: I.tenantUrban, listingId: ur.listings[0]?.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (ur.listings[0] && firstUrbanOffer) {
    await seedListingDealRoom(I.tenantUrban, ur.listings[0].id, I.brokerUrban, firstUrbanOffer.id);
  }

  await seedIntakeAndDocs(I.tenantPrestige, I.brokerPr1, pr.clients, "Montreal", I.client1);
  await seedIntakeAndDocs(I.tenantUrban, I.brokerUrban, ur.clients, "Toronto", I.client2);
  await seedMessaging(I.tenantPrestige, I.brokerPr1, I.asstPrestige, I.client1, pr.listings[0]!.id);
  await seedMessaging(I.tenantUrban, I.brokerUrban, I.adminUrban, I.client2, ur.listings[0]!.id);
  await seedAppointments(I.tenantPrestige, I.brokerPr1, I.client1, pr.listings[0]!.id);
  await seedAppointments(I.tenantUrban, I.brokerUrban, I.client2, ur.listings[0]!.id);
  await seedNotificationsAndTasks(I.tenantPrestige, I.brokerPr1, pr.listings[0]!.id, "Michael");
  await seedNotificationsAndTasks(I.tenantUrban, I.brokerUrban, ur.listings[0]!.id, "Emma");

  await seedDealsForUser();
  await seedAnalytics();

  console.log("[demo-full] Done.");
  console.log(`  Primary broker: david@prestige.demo / ${process.env.DEMO_FULL_PASSWORD?.trim() || "Demo123!"}`);
  console.log(`  Admin: sarah@prestige.demo | Client: michael@client.demo`);
  console.log(`  Tenant slugs: ${SLUG_PRESTIGE}, ${SLUG_URBAN}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
