import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const isProtected = request.nextUrl.pathname.startsWith("/app");
  if (!isProtected) return NextResponse.next();

  // Get JWT token from cookie
  const token = request.cookies.get("mealswipe-session")?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  const user = await verifySession(token);
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
