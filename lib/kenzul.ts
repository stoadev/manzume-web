import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { BookMeta } from "@/lib/data";
import { kenzulHref, type KenzulType } from "@/lib/routes";

export type { KenzulType };

export interface KenzulEntry {
  type: KenzulType;
  no: number | null;
  title: string;
  paragraphs?: string[];
  lines?: string[];
  pdfPage: number;
}

/** Fihrist ve gezinme için gövdesiz hafif kayıt. */
export interface KenzulSummary {
  type: KenzulType;
  no: number | null;
  title: string;
  href: string;
  index: number;
}

export interface KenzulAdjacent {
  index: number;
  total: number;
  prev: KenzulSummary | null;
  next: KenzulSummary | null;
}

interface KenzulData {
  book: BookMeta;
  entries: KenzulEntry[];
}

export const KENZUL_SLUG = "kenzul-maarif";

let cache: KenzulData | null = null;

function loadKenzul(): KenzulData {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "data", KENZUL_SLUG, "kitap.json");
  cache = JSON.parse(fs.readFileSync(filePath, "utf-8")) as KenzulData;
  return cache;
}

export function getKenzulBook(): BookMeta {
  return loadKenzul().book;
}

/** Okuma sırası: JSON sırası (bahis ve manzumeler iç içe). */
export function getKenzulEntries(): KenzulEntry[] {
  return loadKenzul().entries;
}

export function getKenzulSummaries(): KenzulSummary[] {
  return getKenzulEntries().map(({ type, no, title }, index) => ({
    type,
    no,
    title,
    href: kenzulHref(type, no),
    index,
  }));
}

export function getKenzulEntry(type: KenzulType, no: number | null): KenzulEntry | undefined {
  return getKenzulEntries().find((e) => e.type === type && e.no === no);
}

export function getKenzulAdjacent(type: KenzulType, no: number | null): KenzulAdjacent {
  const summaries = getKenzulSummaries();
  const index = summaries.findIndex((e) => e.type === type && e.no === no);
  return {
    index,
    total: summaries.length,
    prev: index > 0 ? summaries[index - 1] : null,
    next: index >= 0 && index < summaries.length - 1 ? summaries[index + 1] : null,
  };
}
