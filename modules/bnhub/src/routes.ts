/**
 * BNHub route definitions for API gateway.
 * Mount at /api/bnhub/* (Express or Next.js API routes).
 */

import { createListingsController } from "./controllers/listings-controller.js";
import { bnhubListingServiceStub } from "./services/listing-service.js";

export const BNHUB_BASE = "/api/bnhub";

/** Route config for gateway: method, path, handler. */
export type RouteHandler = (req: { query?: Record<string, string>; params?: Record<string, string>; body?: unknown }) => Promise<{ status: number; json: unknown }>;

export interface BNHubRouteConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  handler: RouteHandler;
}

const listingsCtrl = createListingsController(bnhubListingServiceStub);

export const bnhubRoutes: BNHubRouteConfig[] = [
  {
    method: "GET",
    path: `${BNHUB_BASE}/listings`,
    handler: (req) => listingsCtrl.listByHost({ query: req.query }),
  },
  {
    method: "GET",
    path: `${BNHUB_BASE}/listings/:id`,
    handler: (req) => listingsCtrl.getById({ params: { id: req.params?.id ?? "" } }),
  },
  {
    method: "POST",
    path: `${BNHUB_BASE}/listings`,
    handler: (req) => listingsCtrl.create({ body: req.body }),
  },
];

/** Register routes with an Express-like router (get, post, etc. each take path and (req, res, next) => void). */
export function registerBnhubRoutes(router: {
  get: (path: string, fn: (req: unknown, res: { status: (n: number) => { json: (d: unknown) => void } }, next: (e?: unknown) => void) => void) => void;
  post: (path: string, fn: (req: unknown, res: { status: (n: number) => { json: (d: unknown) => void } }, next: (e?: unknown) => void) => void) => void;
}): void {
  for (const { method, path, handler } of bnhubRoutes) {
    const fn = (req: unknown, res: { status: (n: number) => { json: (d: unknown) => void } }, next: (e?: unknown) => void) => {
      const r = req as { query?: Record<string, string>; params?: Record<string, string>; body?: unknown };
      handler(r).then(({ status, json }) => res.status(status).json(json)).catch(next);
    };
    if (method === "GET") router.get(path, fn);
    else if (method === "POST") router.post(path, fn);
  }
}
