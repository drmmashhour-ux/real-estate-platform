import { indexById } from "./join-by-id";

/**
 * Generic application-level join: map `related` by `id`, then attach `related` on each item
 * using `item[key]` as the foreign id (batch pattern; avoids N+1).
 */
export function joinById<TItem extends Record<string, unknown>, TRelated extends { id: string }>(
  items: TItem[],
  related: TRelated[],
  key: keyof TItem
): (TItem & { related: TRelated | null })[] {
  const map = indexById(related);
  return items.map((item) => {
    const raw = item[key];
    const id = typeof raw === "string" && raw.length > 0 ? raw : null;
    return {
      ...item,
      related: id ? map.get(id) ?? null : null,
    };
  });
}
