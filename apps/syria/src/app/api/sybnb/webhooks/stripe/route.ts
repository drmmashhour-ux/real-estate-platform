import { POST as postWebhook } from "@/app/api/sybnb/webhook/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Alias path for Stripe — same handler as `api/sybnb/webhook`. */
export const POST = postWebhook;
