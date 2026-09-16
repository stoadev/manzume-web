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

/* ------------------------------------------------------------------ */
/* Osmanlıca nüsha (DivanKenz Tam.pdf) sayfa eşlemesi                 */
/* ------------------------------------------------------------------ */

/**
 * Sayfa görsellerinin CDN kökü; build sırasında env ile değiştirilebilir.
 * Bucket içindeki klasör adı tarihsel olarak `arapca/` (görseller o yolla yüklendi).
 */
export const OSMANLICA_CDN =
  process.env.NEXT_PUBLIC_OSMANLICA_CDN ??
  "https://pub-7d618867abde484cb23868f9c0e9b521.r2.dev/arapca";

interface OsmanlicaEntry {
  no: string;
  startPage: number;
  endPage: number;
  printedPage: number | null;
  guess: boolean;
}

interface OsmanlicaData {
  imagePattern: string;
  poems: OsmanlicaEntry[];
}

export interface OsmanlicaPage {
  /** PDF fiziksel sayfa no (görsel dosya adı bundan türer). */
  page: number;
  /** Kitabın basılı sayfa numarası. */
  printed: number | null;
  src: string;
  /** Bu sayfada (kısmen de olsa) yer alan manzume numaraları. */
  poems: string[];
}

export interface OsmanlicaInfo {
  pages: OsmanlicaPage[];
  /** Başlık okunamayıp komşulardan kestirilen eşleme. */
  guess: boolean;
}

const osmanlicaCache = new Map<string, OsmanlicaData>();

function loadOsmanlica(slug: string): OsmanlicaData | null {
  const cached = osmanlicaCache.get(slug);
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "data", slug, "osmanlica.json");
  if (!fs.existsSync(filePath)) return null;
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as OsmanlicaData;
  osmanlicaCache.set(slug, data);
  return data;
}

function osmanlicaSrc(pattern: string, page: number): string {
  return `${OSMANLICA_CDN}/${pattern.replace("{page:03d}", String(page).padStart(3, "0"))}`;
}

/** Manzumenin Osmanlıca nüshada geçtiği sayfalar; eşleme yoksa null. */
export function getOsmanlicaInfo(slug: string, no: string): OsmanlicaInfo | null {
  const data = loadOsmanlica(slug);
  const entry = data?.poems.find((p) => p.no === no);
  if (!data || !entry) return null;

  const pages: OsmanlicaPage[] = [];
  for (let page = entry.startPage; page <= entry.endPage; page++) {
    const poems = data.poems
      .filter((p) => !p.no.includes("-") && p.startPage <= page && page <= p.endPage)
      .map((p) => p.no);
    pages.push({
      page,
      printed: entry.printedPage === null ? null : entry.printedPage + (page - entry.startPage),
      src: osmanlicaSrc(data.imagePattern, page),
      poems,
    });
  }
  return { pages, guess: entry.guess };
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
