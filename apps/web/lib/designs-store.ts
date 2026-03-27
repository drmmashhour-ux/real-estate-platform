/**
 * In-memory store for saved designs. Replaced by DB (DesignAsset) when persisted.
 * Used by /api/designs and /api/designs/save.
 */

export type DesignRecord = {
  id: string;
  userId: string;
  listingId: string | null;
  title: string;
  imageUrl: string;
  createdAt: Date;
};

const designs: DesignRecord[] = [];

const BYTES_PER_DESIGN = 2 * 1024 * 1024; // 2 MB per design for storage count

export function getDesigns(userId?: string): DesignRecord[] {
  if (!userId) return designs;
  return designs.filter((d) => d.userId === userId);
}

export function getStorageUsed(userId?: string): number {
  const list = userId ? designs.filter((d) => d.userId === userId) : designs;
  return list.length * BYTES_PER_DESIGN;
}

export function addDesign(design: Omit<DesignRecord, "id" | "createdAt">): DesignRecord {
  const record: DesignRecord = {
    ...design,
    id: Date.now().toString() + "-" + Math.random().toString(36).slice(2, 9),
    createdAt: new Date(),
  };
  designs.push(record);
  return record;
}

export const DEFAULT_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024; // 100 MB
