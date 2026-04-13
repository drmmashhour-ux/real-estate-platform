/**
 * Client-side Google Maps / Places key. Must be NEXT_PUBLIC_* so Next inlines it at build/dev start.
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 */
export function getPublicGoogleMapsApiKey(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
}
