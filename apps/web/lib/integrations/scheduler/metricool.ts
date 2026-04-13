/**
 * Metricool — scheduling via workspace API token (official product API where enabled).
 * Endpoint and payload may vary by workspace; configure env per Metricool docs.
 */

export type MetricoolScheduleInput = {
  caption: string;
  mediaUrls: string[];
  scheduledAt: Date;
  platforms: ("tiktok" | "instagram" | "facebook")[];
};

export type MetricoolScheduleResult =
  | { ok: true; externalId?: string; raw?: unknown }
  | { ok: false; error: string };

export async function scheduleWithMetricool(input: MetricoolScheduleInput): Promise<MetricoolScheduleResult> {
  const token = process.env.METRICOOL_API_TOKEN?.trim();
  const blogId = process.env.METRICOOL_BLOG_ID?.trim();
  if (!token || !blogId) {
    return { ok: false, error: "METRICOOL_API_TOKEN / METRICOOL_BLOG_ID not configured" };
  }

  const baseUrl = process.env.METRICOOL_API_BASE_URL?.trim() || "https://app.metricool.com/api/v2/scheduler/posts";

  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blogId,
        text: input.caption,
        media: input.mediaUrls,
        scheduledDate: input.scheduledAt.toISOString(),
        networks: input.platforms,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: `Metricool ${res.status}: ${t.slice(0, 400)}` };
    }
    const raw = await res.json();
    const id =
      typeof (raw as { id?: unknown }).id === "string"
        ? (raw as { id: string }).id
        : typeof (raw as { data?: { id?: string } }).data?.id === "string"
          ? (raw as { data: { id: string } }).data.id
          : undefined;
    return { ok: true, externalId: id, raw };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Metricool request failed" };
  }
}
