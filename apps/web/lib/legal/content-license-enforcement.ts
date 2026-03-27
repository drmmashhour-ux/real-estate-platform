import { NextResponse } from "next/server";
import {
  getRequiredContentLicenseVersion,
  userHasCurrentContentLicense,
} from "@/lib/legal/content-license-service";
import { CONTENT_LICENSE_ERROR } from "@/lib/legal/content-license-client";

export { CONTENT_LICENSE_ERROR };

/** Returns a 403 JSON response if the user must accept the license first. */
export async function requireContentLicenseAccepted(userId: string): Promise<NextResponse | null> {
  const ok = await userHasCurrentContentLicense(userId);
  if (ok) return null;
  const requiredVersion = await getRequiredContentLicenseVersion();
  return NextResponse.json(
    {
      error: CONTENT_LICENSE_ERROR,
      message: "Please accept the Content & Usage License to continue.",
      requiredVersion,
    },
    { status: 403 }
  );
}
