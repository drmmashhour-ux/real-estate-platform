/**
 * Client helpers for AI Platform Manager.
 * When AI_MANAGER_URL is set, call the ai-manager service; otherwise use in-app logic.
 */

const baseUrl = process.env.AI_MANAGER_URL || "";

export async function callAiManager<T>(
  path: string,
  body: unknown
): Promise<T> {
  if (!baseUrl) throw new Error("AI_MANAGER_URL not set");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `AI Manager ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function isAiManagerEnabled(): boolean {
  return Boolean(baseUrl);
}
