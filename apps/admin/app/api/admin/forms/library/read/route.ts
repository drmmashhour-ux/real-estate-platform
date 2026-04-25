import { NextResponse } from "next/server";
import { readDesktopFormText } from "@/lib/forms/desktop-form-loader";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";

  if (!name.trim()) {
    return NextResponse.json({ error: "Provide a file name." }, { status: 400 });
  }

  try {
    const form = await readDesktopFormText(name);
    return NextResponse.json(form);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not read form." },
      { status: 400 }
    );
  }
}
