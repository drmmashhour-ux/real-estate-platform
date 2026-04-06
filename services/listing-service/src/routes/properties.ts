import { Router, type Request, type Response } from "express";
import { PrismaClient, type ListingType, type ListingStatus } from "../generated/prisma/index.js";
import {
  createPropertyBodySchema,
  updatePropertyBodySchema,
  listPropertiesQuerySchema,
} from "../validation/schemas.js";
import { validateBody, validateQuery, sendValidationError } from "../validation/validate.js";
const prisma = new PrismaClient();

function toPropertyResponse(property: {
  id: string;
  ownerId: string;
  brokerId: string | null;
  type: string;
  status: string;
  title: string;
  description: string | null;
  propertyType: string | null;
  address: string;
  city: string;
  region: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  priceCents: number | null;
  currency: string;
  nightlyPriceCents: number | null;
  cleaningFeeCents: number | null;
  maxGuests: number | null;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  houseRules: string | null;
  minNights: number | null;
  maxNights: number | null;
  registrationNumber: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  images: { id: string; url: string; type: string; sortOrder: number }[];
  amenities: { amenityKey: string }[];
}) {
  return {
    id: property.id,
    ownerId: property.ownerId,
    brokerId: property.brokerId,
    type: property.type,
    status: property.status,
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    address: property.address,
    city: property.city,
    region: property.region,
    country: property.country,
    latitude: property.latitude,
    longitude: property.longitude,
    priceCents: property.priceCents,
    currency: property.currency,
    nightlyPriceCents: property.nightlyPriceCents,
    cleaningFeeCents: property.cleaningFeeCents,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    beds: property.beds,
    baths: property.baths,
    checkInTime: property.checkInTime,
    checkOutTime: property.checkOutTime,
    houseRules: property.houseRules,
    minNights: property.minNights,
    maxNights: property.maxNights,
    registrationNumber: property.registrationNumber,
    reviewedAt: property.reviewedAt?.toISOString() ?? null,
    rejectionReason: property.rejectionReason,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
    images: property.images.map((i) => ({ id: i.id, url: i.url, type: i.type, sortOrder: i.sortOrder })),
    amenities: property.amenities.map((a) => a.amenityKey),
  };
}

export function createPropertiesRouter(): Router {
  const router = Router();

  /** POST /properties — create property. Auth required. */
  router.post("/", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const validation = validateBody(createPropertyBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const data = validation.data;
    const property = await prisma.property.create({
      data: {
        ownerId: auth.userId,
        type: data.type,
        title: data.title,
        description: data.description ?? undefined,
        propertyType: data.propertyType ?? undefined,
        address: data.address,
        city: data.city,
        region: data.region ?? undefined,
        country: data.country,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        priceCents: data.priceCents ?? undefined,
        currency: data.currency,
        nightlyPriceCents: data.nightlyPriceCents ?? undefined,
        cleaningFeeCents: data.cleaningFeeCents ?? undefined,
        maxGuests: data.maxGuests ?? undefined,
        bedrooms: data.bedrooms ?? undefined,
        beds: data.beds ?? undefined,
        baths: data.baths ?? undefined,
        checkInTime: data.checkInTime ?? undefined,
        checkOutTime: data.checkOutTime ?? undefined,
        houseRules: data.houseRules ?? undefined,
        minNights: data.minNights ?? undefined,
        maxNights: data.maxNights ?? undefined,
        registrationNumber: data.registrationNumber ?? undefined,
        images: {
          create: (data.images ?? []).map((img, i) => ({
            url: img.url,
            sortOrder: img.sortOrder ?? i,
          })),
        },
        amenities: {
          create: [...new Set(data.amenities ?? [])].map((amenityKey) => ({ amenityKey })),
        },
      },
      include: { images: true, amenities: true },
    });
    res.status(201).json(toPropertyResponse(property));
  });

  /** GET /properties — list with filters. Auth required. */
  router.get("/", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const validation = validateQuery(listPropertiesQuerySchema, req.query);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const { page = 1, pageSize = 20, ownerId, status, type, city, country } = validation.data;
    const where: {
      deletedAt: null;
      ownerId?: string;
      status?: ListingStatus;
      type?: ListingType;
      city?: string;
      country?: string;
    } = { deletedAt: null };
    if (ownerId) where.ownerId = ownerId;
    else if (!auth.roles.includes("ADMIN")) where.status = "LIVE";
    if (status) where.status = status as ListingStatus;
    if (type) where.type = type as ListingType;
    if (city) where.city = city;
    if (country) where.country = country;

    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: { images: true, amenities: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.property.count({ where }),
    ]);
    res.json({
      data: items.map((p) => toPropertyResponse(p)),
      pagination: {
        page,
        pageSize,
        totalCount: total,
        hasMore: page * pageSize < total,
      },
    });
  });

  /** GET /properties/:id — get one. Auth required; non-owners see only LIVE. */
  router.get("/:id", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const id = req.params["id"];
    const property = await prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: { images: true, amenities: true },
    });
    if (!property) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Property not found" } });
      return;
    }
    const isOwnerOrAdmin = auth.userId === property.ownerId || auth.roles.includes("ADMIN");
    if (!isOwnerOrAdmin && property.status !== "LIVE") {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Property not found" } });
      return;
    }
    res.json(toPropertyResponse(property));
  });

  /** PATCH /properties/:id — update. Owner or admin only. */
  router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const id = req.params["id"];
    const property = await prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: { images: true, amenities: true },
    });
    if (!property) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Property not found" } });
      return;
    }
    if (auth.userId !== property.ownerId && !auth.roles.includes("ADMIN")) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Not the property owner or admin" } });
      return;
    }
    const validation = validateBody(updatePropertyBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const data = validation.data;
    const updatePayload: Parameters<typeof prisma.property.update>[0]["data"] = {};
    const scalarKeys: (keyof typeof data)[] = [
      "type", "status", "title", "description", "propertyType", "address", "city", "region", "country",
      "latitude", "longitude", "priceCents", "currency", "nightlyPriceCents", "cleaningFeeCents", "maxGuests",
      "bedrooms", "beds", "baths", "checkInTime", "checkOutTime", "houseRules", "minNights", "maxNights",
      "registrationNumber",
    ];
    for (const key of scalarKeys) {
      const v = data[key];
      if (v !== undefined) (updatePayload as Record<string, unknown>)[key] = v;
    }
    if (data.rejectionReason !== undefined) (updatePayload as Record<string, unknown>).rejectionReason = data.rejectionReason;
    if (data.status === "LIVE") (updatePayload as Record<string, unknown>).reviewedAt = new Date();
    if (data.images !== undefined) {
      await prisma.propertyImage.deleteMany({ where: { propertyId: id } });
      if (data.images.length > 0) {
        await prisma.propertyImage.createMany({
          data: data.images.map((img, i) => ({
            propertyId: id,
            url: img.url,
            sortOrder: img.sortOrder ?? i,
          })),
        });
      }
    }
    if (data.amenities !== undefined) {
      await prisma.propertyAmenity.deleteMany({ where: { propertyId: id } });
      if (data.amenities.length > 0) {
        await prisma.propertyAmenity.createMany({
          data: [...new Set(data.amenities)].map((amenityKey) => ({ propertyId: id, amenityKey })),
        });
      }
    }
    const updated = await prisma.property.update({
      where: { id },
      data: updatePayload as never,
      include: { images: true, amenities: true },
    });
    res.json(toPropertyResponse(updated));
  });

  /** DELETE /properties/:id — soft delete. Owner or admin only. */
  router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const id = req.params["id"];
    const property = await prisma.property.findFirst({
      where: { id, deletedAt: null },
    });
    if (!property) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Property not found" } });
      return;
    }
    if (auth.userId !== property.ownerId && !auth.roles.includes("ADMIN")) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Not the property owner or admin" } });
      return;
    }
    await prisma.property.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });
    res.status(204).send();
  });

  return router;
}
