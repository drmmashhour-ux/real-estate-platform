import { logError } from "@/lib/observability/log";

/** Catch unexpected throws from SYBNB route handlers — never leak DB details to clients. */
export async function sybnbApiCatch(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    logError("SYBNB_API_UNHANDLED", error);
    return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
