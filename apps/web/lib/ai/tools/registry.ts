import "server-only";

export async function toolGetAdminMetrics(_userId: string): Promise<
  | { ok: false; error?: string }
  | {
      ok: true;
      data: {
        bookingsLast24h: number;
        pendingBookings: number;
        activeStrListings: number;
        openDisputes: number;
      };
    }
> {
  void _userId;
  return { ok: false, error: "metrics_stub" };
}
