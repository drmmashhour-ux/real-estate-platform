/**
 * Configurable headline ingestion for investor briefings.
 * Set `INVESTOR_NEWS_FEEDS` to comma-separated RSS URLs (e.g. Bank of Canada, La Presse RSS).
 */

export type NewsBundle = {
  headlines: string[];
  summaries: string[];
  fetchedAt: string;
  sources: string[];
};

function extractRssTitles(xml: string, limit: number): string[] {
  const titles: string[] = [];
  const re = /<item[^>]*>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null && titles.length < limit) {
    const t = m[1]?.replace(/<[^>]+>/g, "").trim();
    if (t) titles.push(t.slice(0, 300));
  }
  return titles;
}

async function fetchFeed(url: string): Promise<string[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" },
      next: { revalidate: 3600 },
    });
    if (!r.ok) return [];
    const xml = await r.text();
    return extractRssTitles(xml, 8);
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

/** One-line heuristic “summary” per headline (no external LLM required). */
function summarizeHeadline(title: string): string {
  if (/(rate|interest|bank of canada|boc|policy rate)/i.test(title)) {
    return `Policy / rates: ${title.slice(0, 160)}`;
  }
  if (/(housing|immobilier|real estate|mortgage|hypoth)/i.test(title)) {
    return `Housing: ${title.slice(0, 160)}`;
  }
  return `Market: ${title.slice(0, 160)}`;
}

export async function fetchInvestorNewsSummaries(): Promise<NewsBundle> {
  const raw = process.env.INVESTOR_NEWS_FEEDS?.trim();
  const urls = raw
    ? raw.split(",").map((s) => s.trim()).filter(Boolean)
    : [
        "https://www.bankofcanada.ca/feed/",
        "https://www.presse.ca/rss/affaires",
      ];

  const headlines: string[] = [];
  const sources: string[] = [];

  for (const url of urls) {
    const h = await fetchFeed(url);
    if (h.length) sources.push(url);
    headlines.push(...h);
  }

  const unique = [...new Set(headlines)].slice(0, 24);
  const summaries = unique.map(summarizeHeadline);

  return {
    headlines: unique,
    summaries,
    fetchedAt: new Date().toISOString(),
    sources,
  };
}
