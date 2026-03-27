import { DocumentFolderType } from "@prisma/client";
import { prisma } from "@/lib/db";

const PRESTIGE_SLUG = "prestige-realty-demo";
const URBAN_SLUG = "urban-property-advisors-demo";

export type DemoWalkthroughData = {
  prestige: { id: string; name: string; slug: string } | null;
  urban: { id: string; name: string; slug: string } | null;
  pId: string | undefined;
  listingP: {
    id: string;
    listingCode: string;
    title: string;
    price: number;
  } | null;
  offerP: { id: string } | null;
  contractP: { id: string; title: string } | null;
  apptP: { id: string; title: string } | null;
  roomFolder: { id: string; name: string } | null;
  brokerUser: { id: string; email: string; name: string | null } | null;
  clientUser: { id: string; email: string; name: string | null } | null;
  intakeClient: { id: string; fullName: string } | null;
  finance: { id: string; salePrice: number | null; grossCommission: number | null } | null;
};

export async function loadDemoWalkthroughData(): Promise<DemoWalkthroughData> {
  const [prestige, urban] = await Promise.all([
    prisma.tenant.findUnique({
      where: { slug: PRESTIGE_SLUG },
      select: { id: true, name: true, slug: true },
    }),
    prisma.tenant.findUnique({
      where: { slug: URBAN_SLUG },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const pId = prestige?.id;

  const [
    listingP,
    offerP,
    contractP,
    apptP,
    roomFolder,
    brokerUser,
    clientUser,
    intakeClient,
  ] = await Promise.all([
    pId
      ? prisma.listing.findFirst({
          where: { tenantId: pId },
          orderBy: { createdAt: "asc" },
          select: { id: true, listingCode: true, title: true, price: true },
        })
      : null,
    pId
      ? prisma.offer.findFirst({
          where: { tenantId: pId, status: "ACCEPTED" },
          select: { id: true },
        })
      : null,
    pId
      ? prisma.contract.findFirst({
          where: { tenantId: pId, status: "signed" },
          select: { id: true, title: true },
        })
      : null,
    pId
      ? prisma.appointment.findFirst({
          where: { tenantId: pId },
          orderBy: { startsAt: "asc" },
          select: { id: true, title: true },
        })
      : null,
    pId
      ? prisma.documentFolder.findFirst({
          where: { tenantId: pId, type: DocumentFolderType.LISTING_ROOM },
          select: { id: true, name: true },
        })
      : null,
    prisma.user.findFirst({
      where: { email: "david@prestige.demo" },
      select: { id: true, email: true, name: true },
    }),
    prisma.user.findFirst({
      where: { email: "michael@client.demo" },
      select: { id: true, email: true, name: true },
    }),
    pId
      ? prisma.brokerClient.findFirst({
          where: { tenantId: pId, fullName: { contains: "Michael", mode: "insensitive" } },
          select: { id: true, fullName: true },
        })
      : null,
  ]);

  const finance = pId
    ? await prisma.dealFinancial.findFirst({
        where: { tenantId: pId },
        select: { id: true, salePrice: true, grossCommission: true },
      })
    : null;

  return {
    prestige,
    urban,
    pId,
    listingP,
    offerP,
    contractP,
    apptP,
    roomFolder,
    brokerUser,
    clientUser,
    intakeClient,
    finance,
  };
}
