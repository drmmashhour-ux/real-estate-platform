import { assertDealRoomAccess } from "@/lib/deals/access";
import { addDealRoomPayment } from "@/lib/deals/add-deal-payment";
import { parsePaymentStatus, parsePaymentType } from "@/lib/deals/validators";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  const access = await assertDealRoomAccess(id, auth.userId, auth.role);
  if (!access.ok) {
    return Response.json({ error: "Not found" }, { status: access.status });
  }

  let body: {
    paymentType?: unknown;
    status?: unknown;
    amountCents?: unknown;
    currency?: unknown;
    paymentRef?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentType = parsePaymentType(body.paymentType);
  if (!paymentType) {
    return Response.json({ error: "Invalid paymentType" }, { status: 400 });
  }
  const status = body.status != null ? parsePaymentStatus(body.status) : undefined;

  const row = await addDealRoomPayment({
    dealRoomId: id,
    paymentType,
    status: status ?? undefined,
    amountCents: typeof body.amountCents === "number" ? body.amountCents : undefined,
    currency: typeof body.currency === "string" ? body.currency : undefined,
    paymentRef: typeof body.paymentRef === "string" ? body.paymentRef : undefined,
    actorUserId: auth.userId,
  });
  return Response.json({ payment: row });
}
