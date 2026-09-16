import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";

/**
 * Site listelenmez ve yalnızca ortak şifreyi bilenler girer.
 * Geçerli oturum çerezi yoksa her istek /giris sayfasına yönlenir.
 */
export default function proxy(request: NextRequest) {
  if (isValidSession(request.cookies.get(AUTH_COOKIE)?.value)) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/giris";
  url.search = "";
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  // Giriş sayfası, giriş API'si, Next iç dosyaları ve tarayıcı meta dosyaları serbest.
  matcher: ["/((?!giris|api/giris|_next/|favicon\.ico|robots\.txt).*)"],
};
