/**
 * Apps/web imports this module for client-side local-first patterns only.
 * No web Prisma/schema mixing — IndexedDB namespaces stay app-specific (`web`, `hadialink`).
 */
export {
  enqueueAction,
  drainOfflineQueue,
  getMeta,
  putMeta,
  putListing,
  getListing,
  isNavigatorOnline,
  subscribeOffline,
  subscribeOnline,
} from "@repo/offline";

export type { OfflineAction, OfflineActionType } from "@repo/offline";
