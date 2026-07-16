import "server-only";
import fs from "node:fs";
import path from "node:path";

export interface BookMeta {
  name: string;
  author: string;
  source: string;
  totalPages: number;
}

export interface Section {
  harf: string;
  name: string;
  startNo: string;
  endNo: string;
}

export interface Poem {
  no: string;
  sortKey: number;
  section: string | null;
  firstLine: string | null;
  blocks: string[][];
  pdfPage: number;
  fihristPage: number | null;
  /** Kullanıcıya gösterilen kitap sayfa numarası. */
  pageNo: number;
}

interface RawPoem {
  no: string;
  section: string | null;
  firstLine: string | null;
  blocks: string[][];
  pdfPage: number;
  fihristPage?: number | null;
}

interface BookData {
  book: BookMeta;
  sections: Section[];
  poems: RawPoem[];
}

function sortKeyFromNo(no: string): number {
  const base = parseInt(no, 10);
  return no.includes("-A") ? base + 0.5 : base;
}

const cache = new Map<string, BookData>();

function loadBookData(slug: string): BookData {
  const cached = cache.get(slug);
  if (cached) return cached;

  const filePath = path.join(process.cwd(), "data", slug, "manzumeler.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as BookData;
  cache.set(slug, data);
  return data;
}

/**
 * pageNo = fihristPage. Bu, kitabın kendi basılı sayfa numarasıdır
 * (fihrist tablosunda okuyucuya gösterilen numara); pdfPage ise PDF
 * dosyasının 0-index'li iç sayfa sırasıdır ve okuyucu için anlamsızdır.
 * 8 manzumede fihristPage eşleşmesi bulunamadığından (bkz.
 * extraction_report.md), komşu manzumelerde gözlemlenen sabit
 * fihristPage = pdfPage + 1 ilişkisiyle fallback uygulanır.
 */
function toPoem(raw: RawPoem): Poem {
  const pageNo = raw.fihristPage ?? raw.pdfPage + 1;
  return { ...raw, fihristPage: raw.fihristPage ?? null, sortKey: sortKeyFromNo(raw.no), pageNo };
}

export function getBook(slug: string): BookMeta {
  return loadBookData(slug).book;
}

export function getSections(slug: string): Section[] {
  return loadBookData(slug).sections;
}

export function getPoems(slug: string): Poem[] {
  return loadBookData(slug).poems.map(toPoem);
}

export function getPoem(slug: string, no: string): Poem | undefined {
  const raw = loadBookData(slug).poems.find((p) => p.no === no);
  return raw ? toPoem(raw) : undefined;
}

export function getPoemsBySection(slug: string, harf: string): Poem[] {
  return loadBookData(slug)
    .poems.filter((p) => p.section === harf)
    .map(toPoem);
}

export interface PoemSummary {
  no: string;
  sortKey: number;
  section: string | null;
  firstLine: string | null;
  pageNo: number;
}

/**
 * Fihrist gibi liste görünümleri için hafif özet — `blocks` içermez.
 * Tüm manzumelerin metnini (700+ manzume) client bundle'a taşımamak için
 * kullanılır (bkz. #011 build boyutu bulgusu).
 */
export function getPoemSummaries(slug: string): PoemSummary[] {
  return getPoems(slug).map(({ no, sortKey, section, firstLine, pageNo }) => ({
    no,
    sortKey,
    section,
    firstLine,
    pageNo,
  }));
}

/** Tüm manzumalar, kitap sırasına göre (sortKey artan). */
export function getOrderedPoems(slug: string): Poem[] {
  return getPoems(slug).sort((a, b) => a.sortKey - b.sortKey);
}

export interface AdjacentPoems {
  index: number;
  total: number;
  prev: Poem | null;
  next: Poem | null;
}

/** Bir manzumenin kitap sırasındaki konumu ile önceki/sonraki komşuları. */
export function getAdjacentPoems(slug: string, no: string): AdjacentPoems {
  const ordered = getOrderedPoems(slug);
  const index = ordered.findIndex((p) => p.no === no);
  return {
    index,
    total: ordered.length,
    prev: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}
