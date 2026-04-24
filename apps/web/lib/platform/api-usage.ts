export type ApiUsageRecord = {
  id: string;
  partnerId: string;
  route: string;
  method: string;
  at: string;
};

const records: ApiUsageRecord[] = [];
const MAX = 500;

export function recordPublicApiUsage(partnerId: string, route: string, method: string): void {
  records.unshift({
    id: `usage_${Date.now()}_${records.length}`,
    partnerId,
    route,
    method,
    at: new Date().toISOString(),
  });
  if (records.length > MAX) records.length = MAX;
}

export function listRecentApiUsage(limit = 50): ApiUsageRecord[] {
  return records.slice(0, limit);
}

/** Test helper */
export function __clearApiUsageForTests(): void {
  records.length = 0;
}
