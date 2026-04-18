/**
 * Growth Engine V4 run history — safe empty state until a dedicated audit table is introduced.
 * Does not fabricate rows.
 */
export type GrowthV4HistorySnapshot = {
  id: string;
  createdAt: string;
  campaignsCount: number;
};

export async function getGrowthV4RunHistory(_limit = 20): Promise<{
  history: GrowthV4HistorySnapshot[];
  latest: GrowthV4HistorySnapshot | null;
}> {
  void _limit;
  return {
    history: [],
    latest: null,
  };
}
