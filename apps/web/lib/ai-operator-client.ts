/**
 * Call AI Operator service. When AI_OPERATOR_URL is set, proxy requests and persist to Prisma.
 */
const baseUrl = process.env.AI_OPERATOR_URL || "";

export function isAiOperatorEnabled(): boolean {
  return Boolean(baseUrl);
}

export async function callAiOperator<T>(
  path: string,
  body: unknown
): Promise<T> {
  if (!baseUrl) throw new Error("AI_OPERATOR_URL not set");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `AI Operator ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getAiOperator<T>(path: string): Promise<T> {
  if (!baseUrl) throw new Error("AI_OPERATOR_URL not set");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`);
  if (!res.ok) throw new Error(`AI Operator GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}
