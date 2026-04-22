/** Placeholder — persist per-user notification toggles when product defines schema. */
export async function wantsEmail(_userId: string): Promise<boolean> {
  return true;
}

export async function wantsSms(_userId: string): Promise<boolean> {
  return false;
}
