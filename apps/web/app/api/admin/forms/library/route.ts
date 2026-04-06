import { NextResponse } from "next/server";
import { getDesktopFormsDirectory, listDesktopForms } from "@/lib/forms/desktop-form-loader";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const forms = await listDesktopForms();
    return NextResponse.json({
      directory: getDesktopFormsDirectory(),
      forms,
    });
  } catch (error) {
    return NextResponse.json(
      {
        directory: getDesktopFormsDirectory(),
        forms: [],
        error: error instanceof Error ? error.message : "Could not read Desktop forms folder.",
      },
      { status: 200 }
    );
  }
}
