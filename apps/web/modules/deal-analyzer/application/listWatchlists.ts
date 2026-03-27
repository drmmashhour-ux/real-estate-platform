import { listWatchlistsForUser as listRows } from "@/modules/deal-analyzer/infrastructure/services/watchlistService";
import { isDealAnalyzerAlertsEnabled } from "@/modules/deal-analyzer/config";
import { mapWatchlistRow } from "@/modules/deal-analyzer/infrastructure/mappers/phase3DtoMappers";

export async function listWatchlistsForUserDto(userId: string) {
  if (!isDealAnalyzerAlertsEnabled()) return null;
  const rows = await listRows(userId);
  return rows.map(mapWatchlistRow);
}
