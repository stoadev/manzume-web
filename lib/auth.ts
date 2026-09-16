import { createHash } from "node:crypto";

/** Tek ortak site şifresi (env). Tanımlı değilse site kilitli kalır. */
export const SITE_PASSWORD = process.env.SITE_SIFRESI ?? "";
export const AUTH_COOKIE = "manzume_oturum";
/** Çerez ömrü: 1 yıl — kullanıcı bir kez girer, bir daha sorulmaz. */
export const AUTH_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Çerezde saklanan değer: şifrenin özeti. Şifre değişince tüm oturumlar
 * kendiliğinden düşer; şifrenin kendisi tarayıcıya yazılmaz.
 */
export function sessionToken(): string {
  return createHash("sha256").update(`manzume:${SITE_PASSWORD}`).digest("hex");
}

export function isValidSession(cookie: string | undefined): boolean {
  return SITE_PASSWORD !== "" && cookie !== undefined && cookie === sessionToken();
}
