const DIACRITIC_MAP: Record<string, string> = {
  â: "a",
  Â: "a",
  î: "i",
  Î: "i",
  û: "u",
  Û: "u",
  ê: "e",
  Ê: "e",
  ı: "i",
  I: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ö: "o",
  Ö: "o",
  ü: "u",
  Ü: "u",
};

export function normalizeText(text: string): string {
  return text
    .split("")
    .map((ch) => DIACRITIC_MAP[ch] ?? ch.toLowerCase())
    .join("");
}
