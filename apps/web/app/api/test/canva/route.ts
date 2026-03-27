export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    designUrl: "https://www.canva.com/",
  });
}
