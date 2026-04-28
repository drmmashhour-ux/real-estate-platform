import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  /** Ultra-lite shell: stripped chrome + minimal assets (handled in `[locale]/layout.tsx`). */
  if (/^\/(?:ar|en)\/lite(?:\/|$)/.test(request.nextUrl.pathname)) {
    response.headers.set("x-syria-lite", "1");
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\.).*)"],
};
