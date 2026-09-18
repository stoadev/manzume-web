import type Fuse from "fuse.js";
import { normalizeText } from "./normalize";

/**
 * İki kitabın arama kutuları (NavCard, KenzulNav) ve hedef sayfadaki
 * vurgulama (Highlighted) için ortak, istemci tarafı saf mantık.
 * normalizeText karakter sayısını koruduğundan normalize metindeki
 * indeksler orijinal metinde birebir kullanılır (guard: uzunluk farklıysa
 * o metin için vurgu/alıntı yapılmaz).
 */

export const MAX_HITS = 50;
export const FUZZY_THRESHOLD = 0.25;
export const MIN_MATCH_CHARS = 3;
const SNIPPET_LEN = 100;

export interface SearchRecord {
  /** Kayıt kimliği (ör. "12-A", "bahis:333"). */
  key: string;
  /** Kitap/okuma sırası. */
  order: number;
  /** "Manzume 224" / "Bahis 333" / "Giriş" */
  label: string;
  href: string;
  /** Başlık (Kenz'il-Maarif); metin gibi aranır, eşleşirse kaydın ilk satırı olur. */
  title?: string;
  /** Mısralar ya da paragraflar (orijinal). */
  texts: string[];
  normTitle?: string;
  normTexts: string[];
}

export interface SearchHit {
  /** Satır kimliği (kayıt + metin indeksi). */
  id: string;
  recordKey: string;
  label: string;
  href: string;
  /** Alıntı (mısra tam ya da kırpılmış parça). */
  quote: string;
  /** İkinci satır (Kenz'il-Maarif'te başlık). */
  sub?: string;
  exact: boolean;
}

export function normalizeQuery(q: string): string {
  return normalizeText(q).replace(/\s+/g, " ").trim();
}

/** Normalize metinde sorgunun geçtiği tüm [start, end] (end dahil değil) aralıkları. */
export function findAll(normText: string, nq: string): [number, number][] {
  const out: [number, number][] = [];
  if (!nq) return out;
  let i = normText.indexOf(nq);
  while (i !== -1) {
    out.push([i, i + nq.length]);
    i = normText.indexOf(nq, i + nq.length);
  }
  return out;
}

/** Orijinal metindeki eşleşme aralıkları; uzunluk korunmadıysa boş. */
export function matchRanges(text: string, nq: string): [number, number][] {
  const norm = normalizeText(text);
  if (norm.length !== text.length) return [];
  return findAll(norm, nq);
}

/** Eşleşme etrafından ~len karakter, kelime sınırında kırpık. */
export function snippetAround(text: string, start: number, end: number, len = SNIPPET_LEN): string {
  if (text.length <= len) return text;
  const half = Math.max(0, Math.floor((len - (end - start)) / 2));
  let from = Math.max(0, start - half);
  let to = Math.min(text.length, end + half);
  if (from > 0) {
    const sp = text.lastIndexOf(" ", from);
    if (sp > 0 && from - sp < 20) from = sp + 1;
  }
  if (to < text.length) {
    const sp = text.indexOf(" ", to);
    if (sp !== -1 && sp - to < 20) to = sp;
  }
  return (from > 0 ? "…" : "") + text.slice(from, to) + (to < text.length ? "…" : "");
}

interface ExactOptions {
  /** Kayıt başına en fazla satır (Kenz-i Şümûs: sınırsız, Kenz'il-Maarif: 2). */
  perRecord: number;
  /** true: alıntı kırpılır; false: metin (mısra) tam verilir. */
  snippet: boolean;
  limit: number;
}

/**
 * Birebir eşleşme katmanı: 1 tam kelime (`aşk`), 2 kelime başı (`aşk%`),
 * 3 kelime içi (`%aşk%`). Kelime sınırı: harf/rakam olmayan her karakter
 * ve metin başı/sonu.
 */
export type MatchTier = 1 | 2 | 3;

const WORD_CHAR = /[\p{L}\p{N}]/u;

function isBoundary(text: string, i: number): boolean {
  return i < 0 || i >= text.length || !WORD_CHAR.test(text[i]);
}

export function tierOf(normText: string, [start, end]: [number, number]): MatchTier {
  const before = isBoundary(normText, start - 1);
  const after = isBoundary(normText, end);
  if (before && after) return 1;
  if (before) return 2;
  return 3;
}

/** Aralıklar içinden en iyi katman ve o katmandaki ilk aralık. */
export function bestMatch(
  normText: string,
  ranges: [number, number][],
): { tier: MatchTier; range: [number, number] } | null {
  let best: { tier: MatchTier; range: [number, number] } | null = null;
  for (const range of ranges) {
    const tier = tierOf(normText, range);
    if (!best || tier < best.tier) best = { tier, range };
    if (tier === 1) break;
  }
  return best;
}

/**
 * (b) Birebir alt dize eşleşmeleri: önce tam kelime, sonra kelime başı,
 * sonra kelime içi; her katman kendi içinde kitap sırasına göre.
 * Kenz-i Şümûs'ta katman mısra bazında (her mısra ayrı satır).
 */
export function exactHits(records: SearchRecord[], nq: string, opts: ExactOptions): SearchHit[] {
  const tiers: SearchHit[][] = [[], [], []];
  if (!nq) return [];
  const sorted = [...records].sort((a, b) => a.order - b.order);
  for (const r of sorted) {
    let count = 0;
    const push = (text: string, idx: number, normText: string, ranges: [number, number][]) => {
      const best = bestMatch(normText, ranges);
      if (!best) return;
      tiers[best.tier - 1].push({
        id: `${r.key}#${idx}`,
        recordKey: r.key,
        label: r.label,
        href: r.href,
        quote: opts.snippet ? snippetAround(text, best.range[0], best.range[1]) : text,
        sub: r.title,
        exact: true,
      });
      count++;
    };
    if (r.normTitle !== undefined && r.title !== undefined && r.normTitle.length === r.title.length) {
      push(r.title, -1, r.normTitle, findAll(r.normTitle, nq));
    }
    for (let i = 0; i < r.texts.length && count < opts.perRecord; i++) {
      if (r.normTexts[i].length !== r.texts[i].length) continue;
      push(r.texts[i], i, r.normTexts[i], findAll(r.normTexts[i], nq));
    }
  }
  return tiers.flat().slice(0, opts.limit);
}

/** Fuse anahtarları: SearchRecord alanları. */
export const FUSE_KEYS = ["normTitle", "normTexts"];

/** (c) Bulanık sonuçlar; birebir eşleşen kayıtlar dışarıda bırakılır. */
export function fuzzyHits(
  fuse: Fuse<SearchRecord>,
  nq: string,
  exclude: Set<string>,
  limit: number,
  snippet: boolean,
): SearchHit[] {
  const hits: SearchHit[] = [];
  if (!nq || limit <= 0) return hits;
  for (const res of fuse.search(nq, { limit: limit + exclude.size })) {
    const r = res.item;
    if (exclude.has(r.key)) continue;
    const m = res.matches?.find((x) => x.key === "normTexts") ?? res.matches?.[0];
    let quote = r.texts[0] ?? r.title ?? "";
    if (m) {
      const isTitle = m.key === "normTitle";
      const text = isTitle ? (r.title ?? "") : (r.texts[m.refIndex ?? 0] ?? "");
      const [s, e] = m.indices.reduce(
        (best, cur) => (cur[1] - cur[0] > best[1] - best[0] ? cur : best),
        m.indices[0] ?? [0, 0],
      );
      quote = snippet ? snippetAround(text, s, e + 1) : text;
    }
    hits.push({
      id: `${r.key}#~`,
      recordKey: r.key,
      label: r.label,
      href: r.href,
      quote,
      sub: r.title,
      exact: false,
    });
    if (hits.length >= limit) break;
  }
  return hits;
}

export function withQuery(href: string, nq: string): string {
  return nq ? `${href}?q=${encodeURIComponent(nq)}` : href;
}

export function countLabel(n: number): string {
  return n > MAX_HITS ? `${MAX_HITS}+ sonuç, daraltın` : `${n} sonuç`;
}
