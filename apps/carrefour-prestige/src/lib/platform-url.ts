/**
 * External Next.js platform (prop-tech app). Set in .env for production.
 * Marketing site buttons point here — not the brochure URL.
 */
export function getPlatformAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PLATFORM_APP_URL?.replace(/\/$/, "") ??
    "https://your-platform-app.vercel.app"
  );
}

export function getAnalyzerAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ANALYZER_APP_URL?.replace(/\/$/, "") ??
    `${getPlatformAppUrl()}/dashboard/investor`
  );
}
