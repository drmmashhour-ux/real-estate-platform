/**
 * Application-level joins (Map + assign) for patterns that avoid Prisma `include` when
 * moving to separate Prisma clients: same tables, `guestId` / `userId` only, resolve in code.
 */
export function indexById<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.id, r]));
}

/**
 * Batch-attach related rows looked up by `id`, using a foreign key field on `items`.
 * Output shape: each item gets `attachKey` (e.g. `guest` / `user`) with the row or `null`.
 */
export function joinByForeignKey<
  TItem extends Record<string, unknown>,
  TRelated extends { id: string },
  TKey extends keyof TItem,
  TAttach extends string,
>(
  items: TItem[],
  related: TRelated[],
  foreignKey: TKey,
  attachKey: TAttach
): (TItem & { [K in TAttach]: TRelated | null })[] {
  const m = indexById(related);
  return items.map((item) => {
    const raw = item[foreignKey];
    const id = typeof raw === "string" && raw.length > 0 ? raw : null;
    const row = id ? m.get(id) ?? null : null;
    return { ...item, [attachKey]: row } as TItem & { [K in TAttach]: TRelated | null };
  });
}
