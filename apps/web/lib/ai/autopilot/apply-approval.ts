import "server-only";

export async function applyHostAutopilotApproval(_input: {
  hostId: string;
  listingId: string;
  payload: unknown;
}): Promise<{ ok: boolean }> {
  return { ok: true };
}
