import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, AUTH_MAX_AGE, SITE_PASSWORD, sessionToken } from "@/lib/auth";

/** Sadece site içi yollara dön; dış adrese yönlendirme yapma. */
function safeNext(value: FormDataEntryValue | null): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const password = form.get("sifre");
  const next = safeNext(form.get("next"));

  if (SITE_PASSWORD === "" || password !== SITE_PASSWORD) {
    const url = new URL("/giris", request.url);
    url.searchParams.set("hata", "1");
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(AUTH_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  return response;
}
