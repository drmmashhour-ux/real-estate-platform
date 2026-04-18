/**
 * Executes **approved** BNHub autopilot actions that mutate listing content only.
 * Never touches Stripe, bookings, or ranking engines.
 */

import { prisma } from "@/lib/db";
import type { BNHubAutopilotAction } from "./bnhub-autopilot.types";
import {
  getBnhubAutopilotAction,
  listBnhubAutopilotActionsForListing,
  updateBnhubAutopilotAction,
} from "./bnhub-autopilot-store.service";
import { storeRollbackSnapshot } from "./bnhub-autopilot-rollback.service";
import { recordBnhubAutopilotExecuted } from "./bnhub-autopilot-monitoring.service";
import { bnhubAutopilotExecutionFlags } from "@/config/feature-flags";

const EXECUTABLE = new Set<BNHubAutopilotAction["type"]>(["IMPROVE_TITLE", "IMPROVE_DESCRIPTION", "ADD_AMENITIES"]);

function mergeAmenities(current: unknown, append: string[]): unknown {
  const base = Array.isArray(current) ? [...current] : [];
  const set = new Set(base.map((x) => String(x)));
  for (const a of append) {
    const t = a.trim();
    if (t) set.add(t);
  }
  return [...set];
}

async function executeOne(action: BNHubAutopilotAction): Promise<{ ok: boolean; error?: string }> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: action.listingId },
    select: { id: true, title: true, description: true, amenities: true },
  });
  if (!listing) return { ok: false, error: "listing_not_found" };

  const p = action.payload;

  try {
    if (action.type === "IMPROVE_TITLE" && p.kind === "title") {
      const prev = listing.title;
      const next = p.proposedTitle.trim().slice(0, 200);
      if (!next) return { ok: false, error: "empty_title" };
      await prisma.shortTermListing.update({
        where: { id: listing.id },
        data: { title: next },
      });
      storeRollbackSnapshot({
        actionId: action.id,
        listingId: listing.id,
        field: "title",
        previousValue: prev,
        executedAt: new Date().toISOString(),
      });
      return { ok: true };
    }

    if (action.type === "IMPROVE_DESCRIPTION" && p.kind === "description") {
      const prev = listing.description;
      const next = p.proposedDescription.trim().slice(0, 20000);
      await prisma.shortTermListing.update({
        where: { id: listing.id },
        data: { description: next || null },
      });
      storeRollbackSnapshot({
        actionId: action.id,
        listingId: listing.id,
        field: "description",
        previousValue: prev,
        executedAt: new Date().toISOString(),
      });
      return { ok: true };
    }

    if (action.type === "ADD_AMENITIES" && p.kind === "amenities") {
      const prev = listing.amenities;
      const merged = mergeAmenities(listing.amenities, p.appendAmenities);
      await prisma.shortTermListing.update({
        where: { id: listing.id },
        data: { amenities: merged as object },
      });
      storeRollbackSnapshot({
        actionId: action.id,
        listingId: listing.id,
        field: "amenities",
        previousValue: prev,
        executedAt: new Date().toISOString(),
      });
      return { ok: true };
    }

    return { ok: false, error: "unsupported_payload" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "update_failed" };
  }
}

/**
 * Runs all **approved** actions for a listing. Non-executable types are skipped.
 */
export async function executeApprovedBNHubActions(listingId: string): Promise<{
  executed: number;
  skipped: number;
  errors: string[];
}> {
  if (!bnhubAutopilotExecutionFlags.autopilotV1 || !bnhubAutopilotExecutionFlags.executionV1) {
    return { executed: 0, skipped: 0, errors: ["flags_off"] };
  }

  const actions = listBnhubAutopilotActionsForListing(listingId);
  let executed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const action of actions) {
    if (action.status !== "approved") {
      skipped += 1;
      continue;
    }
    if (!EXECUTABLE.has(action.type)) {
      skipped += 1;
      continue;
    }
    const r = await executeOne(action);
    if (r.ok) {
      updateBnhubAutopilotAction(action.id, { status: "executed" });
      try {
        recordBnhubAutopilotExecuted(action.id);
      } catch {
        /* */
      }
      executed += 1;
      // eslint-disable-next-line no-console
      console.log("[bnhub:autopilot]", "execution_ok", { actionId: action.id.slice(0, 12), type: action.type });
    } else {
      errors.push(`${action.id}:${r.error ?? "fail"}`);
      skipped += 1;
    }
  }

  return { executed, skipped, errors };
}

/**
 * Execute a single approved action by id (used by API).
 */
export async function executeBnHubAutopilotAction(actionId: string): Promise<{ ok: boolean; error?: string }> {
  if (!bnhubAutopilotExecutionFlags.autopilotV1 || !bnhubAutopilotExecutionFlags.executionV1) {
    return { ok: false, error: "flags_off" };
  }
  const action = getBnhubAutopilotAction(actionId);
  if (!action) return { ok: false, error: "not_found" };
  if (action.status !== "approved") return { ok: false, error: "not_approved" };
  if (!EXECUTABLE.has(action.type)) return { ok: false, error: "not_executable" };

  const r = await executeOne(action);
  if (!r.ok) return { ok: false, error: r.error };
  updateBnhubAutopilotAction(actionId, { status: "executed" });
  try {
    recordBnhubAutopilotExecuted(actionId);
  } catch {
    /* */
  }
  // eslint-disable-next-line no-console
  console.log("[bnhub:autopilot]", "execution_ok", { actionId: actionId.slice(0, 12), type: action.type });
  return { ok: true };
}
