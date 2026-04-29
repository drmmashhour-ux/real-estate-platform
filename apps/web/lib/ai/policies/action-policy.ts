import "server-only";

/**
 * Classify whether a host/manager action key is allowed to enter the approval queue.
 * Conservative default: allow — override with env-driven blocklist if needed.
 */
export function classifyActionKey(key: string): "allowed" | "restricted" | "forbidden" {
  const normalized = key.trim().toLowerCase();
  if (!normalized || normalized.includes("delete_all") || normalized.includes("purge")) return "forbidden";
  return "allowed";
}
