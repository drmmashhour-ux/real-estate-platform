import { POST as postWebhook } from "@/app/api/sybnb/webhook/route";

/** Alias path for Stripe — same handler as `api/sybnb/webhook`. */
export const POST = postWebhook;
