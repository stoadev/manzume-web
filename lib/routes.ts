export const bookHref = (slug: string) => `/kitap/${slug}`;

export const poemHref = (slug: string, no: string) =>
  `/kitap/${slug}/manzume/${no}`;

export type KenzulType = "giris" | "bahis" | "manzume";

export const kenzulHref = (type: KenzulType, no: number | null) =>
  type === "giris"
    ? "/kitap/kenzul-maarif/giris"
    : `/kitap/kenzul-maarif/${type}/${no}`;

/** İstemci bileşenlerinde de kullanılır (lib/kenzul.ts server-only). */
export const kenzulLabel = (type: KenzulType, no: number | null) =>
  type === "giris" ? "Giriş" : `${type === "bahis" ? "Bahis" : "Manzume"} ${no}`;
