import { analyzeConversion } from "@/lib/ai/conversionEngine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const listing = await req.json();
  return Response.json(analyzeConversion(listing));
}
