import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { requireUser } from "@/lib/auth/require-user";
import { getBrokerTransactionsPayload } from "@/lib/financial/broker-financial-dashboard";
import { listTransactionRecords } from "@/lib/financial/transaction-records";
import { resolveFinancialRegistryScope } from "@/lib/financial/registry-api-scope";

export const dynamic = "force-dynamic";

const postBodySchema = z.object({
  ownerType: z.string().min(1),
  ownerId: z.string().min(1),
  transactionType: z.string().optional(),
});

/** GET /api/financial/transactions — broker revenue ledger + commission rollups for Financial OS. */
export async function GET() {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  const payload = await getBrokerTransactionsPayload(auth.user.id);
  return NextResponse.json(payload);
}

/** POST /api/financial/transactions — list `TransactionRecord` rows (scoped to session). */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof postBodySchema>;
  try {
    body = postBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const scope = await resolveFinancialRegistryScope(auth.user, body);
  if (scope instanceof NextResponse) return scope;

  const data = await listTransactionRecords(scope.ownerType, scope.ownerId, {
    transactionType: body.transactionType,
  });

  return NextResponse.json({ success: true, data });
}
