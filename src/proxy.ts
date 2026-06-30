import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Next.js 16 uses proxy.ts instead of middleware.ts
 * This handles route protection at the edge
 */
const { auth } = NextAuth(authConfig);

export function proxy(request: Parameters<typeof auth>[0]) {
  return auth(request as any);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (svg, png, jpg, etc.)
     * - api/auth (Auth.js routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth).*)",
  ],
};
