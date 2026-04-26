import { marketplacePrisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (!user || typeof user !== "object" || !("userId" in user)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (user as { userId: string }).userId;
  const { id } = await context.params;

  const booking = await marketplacePrisma.booking.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!booking) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.userId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(booking);
}
