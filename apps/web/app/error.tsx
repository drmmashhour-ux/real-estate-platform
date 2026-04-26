"use client";

import { sendAlert } from "@/lib/alerts";

export default function GlobalError({ error }: { error: Error }) {
  console.error(error);
  sendAlert(`App error boundary: ${error.message}`);
  return <div>Error: {error.message}</div>;
}
