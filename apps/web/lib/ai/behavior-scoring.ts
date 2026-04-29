import "server-only";

/** Lightweight profile refresh placeholder — callers already persist `aiUserActivityLog` rows beforehand. */
export async function refreshUserAiProfile(_userId: string): Promise<void> {}
