/**
 * Register event bus consumers for platform modules.
 * Import this once at app startup (e.g. in layout or instrumentation) to connect modules.
 */

import { subscribe, subscribeMany } from "./subscriptions";
import type { StoredPlatformEvent } from "./types";

const MODULE_PROPERTY = "property-lifecycle";
const MODULE_IDENTITY = "identity-network";
const MODULE_TRANSACTION = "transaction-timeline";
const MODULE_BNHUB = "bnhub";
const MODULE_ESCROW = "escrow";
const MODULE_TRUST = "trust-score";
const MODULE_DOCUMENTS = "document-drafting";
const MODULE_NOTARY = "notary-closing";
const MODULE_AI = "ai-brain";

function noop(_event: StoredPlatformEvent) {
  // Placeholder: replace with real orchestration
}

let registered = false;

export function registerPlatformEventConsumers(): void {
  if (registered) return;
  registered = true;

  // Property lifecycle
  subscribeMany(
    ["property_created", "property_verified", "property_updated", "property_sold", "property_closed"],
    (event) => {
      noop(event);
      // e.g. property lifecycle orchestrator: update state, trigger verification pipeline
    }
  );

  // Identity
  subscribeMany(["owner_verified", "broker_verified", "identity_flagged"], (event) => {
    noop(event);
    // e.g. trust score engine, document drafting (broker agreement)
  });

  // Transaction timeline
  subscribeMany(
    [
      "offer_created",
      "offer_accepted",
      "inspection_completed",
      "financing_confirmed",
      "closing_scheduled",
      "transaction_closed",
    ],
    (event) => {
      noop(event);
      // e.g. transaction timeline engine: advance stage, complete step
    }
  );

  // BNHUB
  subscribeMany(["rental_booking_created", "rental_payment_received", "rental_completed"], (event) => {
    noop(event);
    // e.g. escrow engine, trust score, analytics
  });

  // Fraud / trust
  subscribeMany(["fraud_detected", "trust_score_updated", "listing_flagged"], (event) => {
    noop(event);
    // e.g. trust score engine, compliance alerts
  });

  // AI
  subscribeMany(
    [
      "valuation_generated",
      "pricing_recommended",
      "investment_opportunity_detected",
      "transaction_risk_alert",
    ],
    (event) => {
      noop(event);
      // e.g. AI real estate brain: aggregate signals, update recommendations
    }
  );

  // Document drafting: react to transaction/property events to suggest document generation
  subscribe("offer_accepted", (event) => {
    noop(event);
    // e.g. trigger offer document or closing package when ready
  });
  subscribe("closing_scheduled", (event) => {
    noop(event);
    // e.g. ensure closing package generated
  });

  // Notary: react to closing and document events
  subscribe("closing_scheduled", (event) => {
    noop(event);
    // e.g. ensure notary assigned, package ready
  });
}
