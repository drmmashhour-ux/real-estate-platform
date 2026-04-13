/**
 * Platform Event Bus – publish, subscribe, log, queue.
 *
 * Modules can:
 * - publish(eventType, options) to emit events
 * - subscribe(eventType, consumer) to handle events
 * - query event log via event-log
 *
 * Connected modules: property lifecycle, AI brain, document drafting,
 * BNHUB, escrow, trust score, transaction timeline, notary integration.
 */

export * from "./types";
export * from "./event-log";
export * from "./subscriptions";
export * from "./queue";
export * from "./publisher";
export { registerPlatformEventConsumers } from "./integrations";
