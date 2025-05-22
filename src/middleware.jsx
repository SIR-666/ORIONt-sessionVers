import { NextResponse } from "next/server";

export async function middleware(request) {
  const profile = request.cookies.get("profile")?.value;
  const { pathname } = request.nextUrl;

  // Jika user belum login dan bukan sedang menuju ke /login
  if (!profile && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Jika user sudah login dan mencoba buka /login, arahkan ke /order
  if (profile && pathname === "/login") {
    return NextResponse.redirect(new URL("/order", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/order/:path*",
    "/stoppage/:path*",
    "/main/:path*",
    "/report",
    "/performance",
    "/masterDowntime",
    "/login",
  ],
};
