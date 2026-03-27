/** Structured JSON errors for TrustGraph API routes (no stack traces). */
export function trustgraphJsonError(message: string, status: number, details?: unknown): Response {
  const body: Record<string, unknown> = { error: message };
  if (details !== undefined) body.details = details;
  return Response.json(body, { status });
}

export function trustgraphJsonOk(data: unknown): Response {
  return Response.json(data);
}
