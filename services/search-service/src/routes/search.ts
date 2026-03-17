import { Router, type Request, type Response } from "express";
import {
  searchPropertiesQuerySchema,
  suggestionsQuerySchema,
  mapSearchQuerySchema,
} from "../validation/schemas.js";
import { validateQuery, sendValidationError } from "../validation/validate.js";
import type { SortOption } from "../search/indexer.js";
import { searchProperties, getSuggestions, searchMap } from "../search/propertySearch.js";

export function createSearchRouter(): Router {
  const router = Router();

  /** GET /search/properties — search with city, price range, property type, guests, pagination, sort */
  router.get("/properties", async (req: Request, res: Response): Promise<void> => {
    const validation = validateQuery(searchPropertiesQuerySchema, req.query);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const data = validation.data;
      const result = await searchProperties({
        ...data,
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 20,
        sort: (data.sort ?? "newest") as SortOption,
      });
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Search failed" } });
    }
  });

  /** GET /search/suggestions — typeahead for city or propertyType */
  router.get("/suggestions", async (req: Request, res: Response): Promise<void> => {
    const validation = validateQuery(suggestionsQuerySchema, req.query);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const d = validation.data;
      const result = await getSuggestions(d.field ?? "city", d.q, d.limit ?? 10);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Suggestions failed" } });
    }
  });

  /** GET /search/map — properties in bounds or center+radius for map view */
  router.get("/map", async (req: Request, res: Response): Promise<void> => {
    const validation = validateQuery(mapSearchQuerySchema, req.query);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const { minLat, maxLat, minLng, maxLng, lat, lng, radiusKm } = validation.data;
    const hasBounds = minLat != null && maxLat != null && minLng != null && maxLng != null;
    const hasCenter = lat != null && lng != null && radiusKm != null;
    if (!hasBounds && !hasCenter) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Provide either (minLat, maxLat, minLng, maxLng) or (lat, lng, radiusKm)",
        },
      });
      return;
    }
    try {
      const data = validation.data;
      const result = await searchMap({
        ...data,
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 50,
      });
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Map search failed" } });
    }
  });

  return router;
}
