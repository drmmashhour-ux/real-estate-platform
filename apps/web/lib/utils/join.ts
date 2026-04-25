import { indexById, joinByForeignKey } from "./join-by-id";

/**
 * Generic application-level join: map `related` by `id`, then attach under `attachKey` (default `related`)
 * using `item[fkKey]` as the foreign id — batch pattern; avoids N+1.
 */
export function joinById<TItem extends Record<string, unknown>, TRelate extends { id: string }>(
  items: TItem[],
  related: TRelate[],
  fkKey: keyof TItem,
  attachKey: string = "related"
) {
  const map = indexById(related);
  return items.map((item) => {
    const raw = item[fkKey];
    const id = typeof raw === "string" && raw.length > 0 ? raw : null;
    const row = id ? (map.get(id) ?? null) : null;
    return { ...item, [attachKey]: row } as TItem & Record<string, TRelate | null>;
  });
}

export { indexById, joinByForeignKey };
