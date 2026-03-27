export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    title: "AI Luxury Villa",
    description: "Generated description for testing.",
    highlights: ["Pool", "Sea view", "Modern amenities"],
  });
}
