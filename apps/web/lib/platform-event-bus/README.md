# Platform Event Bus

Central event system for LECIPM: publish events, route to subscribers, persist in event log, and process asynchronously.

## Responsibilities

1. **Event Publisher** – Any module can `publish(eventType, options)` when important actions occur.
2. **Event Router** – Events are dispatched to all consumers subscribed to that event type (or `*`).
3. **Event Queue** – Events are stored first, then dispatched asynchronously via `setImmediate` for reliable delivery.
4. **Event Consumers** – Modules call `subscribe(eventType, consumer)` to handle specific event types.
5. **Event Log** – Every event is stored in `platform_events` with `event_id`, `event_type`, `source_module`, `payload`, `timestamp`, `processing_status`.

## Standard event types

- **Property:** `property_created`, `property_verified`, `property_updated`, `property_sold`, `property_closed`
- **Identity:** `owner_verified`, `broker_verified`, `identity_flagged`
- **Transaction:** `offer_created`, `offer_accepted`, `inspection_completed`, `financing_confirmed`, `legal_documents_prepared`, `closing_scheduled`, `transaction_closed`
- **BNHub:** `rental_booking_created`, `rental_payment_received`, `rental_completed`
- **Fraud:** `fraud_detected`, `trust_score_updated`, `listing_flagged`
- **AI:** `valuation_generated`, `pricing_recommended`, `investment_opportunity_detected`, `transaction_risk_alert`

## Usage

```ts
import { publish, subscribe, listEvents, processPendingEvents, registerPlatformEventConsumers } from "@/lib/platform-event-bus";

// At app startup, register module consumers
registerPlatformEventConsumers();

// Publish an event
await publish("property_verified", {
  sourceModule: "property-identity",
  entityType: "property",
  entityId: propertyId,
  payload: { score: 90 },
});

// Subscribe to events
subscribe("offer_accepted", async (event) => {
  // e.g. advance transaction timeline, trigger document generation
});

// Admin: list events, process pending (e.g. cron)
const events = await listEvents({ eventType: "transaction_closed", limit: 50 });
const result = await processPendingEvents(100);
```

## Connected modules

- Property lifecycle orchestrator
- AI real estate brain
- Document drafting engine
- BNHub rental system
- Escrow engine
- Trust score engine
- Transaction timeline engine
- Notary integration

Consumers are registered in `integrations.ts`; replace placeholder handlers with real orchestration.

## API

- `GET /api/admin/event-bus/events` – List events (query: eventType, sourceModule, processingStatus, since, limit).
- `POST /api/admin/event-bus/process-pending` – Process pending events from the log (body: limit).

## Processing status

Events are stored with `processing_status`: `pending` → after consumer run → `processed` or `failed`. Use `processPendingEvents()` from a worker or cron to retry pending/failed events if needed.
