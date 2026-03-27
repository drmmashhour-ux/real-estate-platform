/**
 * BNHub listings controller — HTTP handlers for listing CRUD.
 * Mount in API gateway or Next.js API routes.
 */

import type { BNHubListingService } from "../services/listing-service.js";

export function createListingsController(service: BNHubListingService) {
  return {
    async create(req: { body: unknown }) {
      const body = req.body as Record<string, unknown>;
      const listing = await service.create({
        hostId: String(body.hostId),
        title: String(body.title),
        description: body.description != null ? String(body.description) : undefined,
        address: String(body.address),
        city: String(body.city),
        country: String(body.country ?? "US"),
        maxGuests: Number(body.maxGuests ?? 4),
        beds: Number(body.beds),
        bathrooms: Number(body.bathrooms ?? body.baths ?? 1),
        nightlyPriceCents: Number(body.nightlyPriceCents),
        cleaningFeeCents: Number(body.cleaningFeeCents ?? 0),
        securityDepositCents: Number(body.securityDepositCents ?? 0),
        instantBookEnabled: Boolean(body.instantBookEnabled),
        status: "draft",
      } as Parameters<BNHubListingService["create"]>[0]);
      return { status: 201, json: listing };
    },
    async getById(req: { params: { id: string } }) {
      const listing = await service.getById(req.params.id);
      if (!listing) return { status: 404, json: { error: "Not found" } };
      return { status: 200, json: listing };
    },
    async listByHost(req: { query: { hostId?: string } }) {
      const hostId = req.query.hostId;
      if (!hostId) return { status: 400, json: { error: "hostId required" } };
      const listings = await service.listByHost(hostId);
      return { status: 200, json: listings };
    },
  };
}
