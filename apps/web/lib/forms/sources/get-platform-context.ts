import { prisma } from "@/lib/db";

export type PlatformFormContext = {
  broker: { id: string; name: string | null; email: string | null };
  /** When a client party is linked, exposed as buyer for common form mappings. */
  buyer?: { name: string | null; email: string | null };
  seller?: { name: string | null; email: string | null };
  client?: { id: string; name: string | null; email: string | null };
  listing?: {
    kind: "fsbo" | "crm";
    id: string;
    title: string;
    address: string;
    city: string;
    region: string | null;
    priceCents: number;
  };
};

function getPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function getValueFromContext(ctx: PlatformFormContext, mapping: string): unknown {
  return getPath(ctx, mapping);
}

export async function getPlatformContext(args: {
  brokerUserId: string;
  clientUserId?: string | null;
  listingId?: string | null;
}): Promise<PlatformFormContext | null> {
  const broker = await prisma.user.findUnique({
    where: { id: args.brokerUserId },
    select: { id: true, name: true, email: true },
  });
  if (!broker) return null;

  const client = args.clientUserId
    ? await prisma.user.findUnique({
        where: { id: args.clientUserId },
        select: { id: true, name: true, email: true },
      })
    : undefined;

  let listing: PlatformFormContext["listing"];
  if (args.listingId) {
    const fsbo = await prisma.fsboListing.findUnique({
      where: { id: args.listingId },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        region: true,
        priceCents: true,
      },
    });
    if (fsbo) {
      listing = {
        kind: "fsbo",
        id: fsbo.id,
        title: fsbo.title,
        address: fsbo.address,
        city: fsbo.city,
        region: fsbo.region,
        priceCents: fsbo.priceCents,
      };
    } else {
      const crm = await prisma.listing.findUnique({
        where: { id: args.listingId },
        select: {
          id: true,
          title: true,
          listingCode: true,
        },
      });
      if (crm) {
        listing = {
          kind: "crm",
          id: crm.id,
          title: crm.title,
          address: "",
          city: "",
          region: null,
          priceCents: Math.round((crm.price ?? 0) * 100),
        };
      }
    }
  }

  return {
    broker: { id: broker.id, name: broker.name, email: broker.email },
    client: client ?? undefined,
    buyer: client ? { name: client.name, email: client.email } : undefined,
    listing,
  };
}
