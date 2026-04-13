/**
 * Fetch an image URL for server-side checks (vision, malware path, etc.).
 */
export async function fetchRemoteImageBufferForAssessment(
  url: string,
  maxBytes = 6 * 1024 * 1024
): Promise<Buffer | null> {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 25_000);
    const res = await fetch(trimmed, {
      redirect: "follow",
      signal: ac.signal,
      headers: { Accept: "image/*" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const len = res.headers.get("content-length");
    if (len && Number(len) > maxBytes) return null;
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    if (buf.length > maxBytes) return null;
    return buf;
  } catch {
    return null;
  }
}
