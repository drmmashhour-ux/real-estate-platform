import { safeApiError } from "@/lib/api/safe-error-response";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isProductionEnv } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isProductionEnv()) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const listing = await prisma.shortTermListing.findFirst({
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
    return Response.json(listing ?? { message: "No listing found. Run: npx prisma db seed" });
  } catch (error) {
    return safeApiError(error, 500, { context: "GET /api/test/listing" });
  }
}
