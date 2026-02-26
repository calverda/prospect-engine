import { NextRequest, NextResponse } from "next/server";
import { isValidToken } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  if (!token || !isValidToken(token)) {
    // API routes return 401, pages redirect to login
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/prospect/:path*",
    "/territory",
    "/api/generate",
    "/api/import",
    "/api/territory",
    "/api/prospects/:path*",
  ],
};
