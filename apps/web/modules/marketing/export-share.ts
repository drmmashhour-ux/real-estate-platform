/**
 * Share / export helpers — no tracking side effects; URLs are standard vendor share endpoints.
 */

export function buildFacebookShareUrl(pageUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
}

export function buildLinkedInShareUrl(pageUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
}

/** Instagram has no web share URL — returns intent to copy caption + open instagram.com */
export function instagramShareHint(): { copyCaption: true; openUrl: string } {
  return { copyCaption: true, openUrl: "https://www.instagram.com/" };
}

export function downloadTextFile(filename: string, contents: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareNativeOrFallback(title: string, text: string, url: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
