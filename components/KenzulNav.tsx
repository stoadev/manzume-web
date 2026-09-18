"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { SheetNavContext } from "@/components/ReaderShell";
import SearchResults from "@/components/SearchResults";
import type { KenzulSummary } from "@/lib/kenzul";
import { normalizeText } from "@/lib/normalize";
import { bookHref, kenzulHref, kenzulLabel, type KenzulType } from "@/lib/routes";
import {
  FUSE_KEYS,
  FUZZY_THRESHOLD,
  MAX_HITS,
  MIN_MATCH_CHARS,
  exactHits,
  fuzzyHits,
  normalizeQuery,
  withQuery,
  type SearchHit,
  type SearchRecord,
} from "@/lib/search";

interface KenzulNavProps {
  bookName: string;
  summaries: KenzulSummary[];
  variant?: "inline";
}

interface IndexEntry {
  type: KenzulType;
  no: number | null;
  title: string;
  text: string[];
}

/** Uzun bahislerde kayıt başına en fazla 2 alıntı satırı. */
const PER_RECORD = 2;

function keyOf(type: KenzulType, no: number | null) {
  return `${type}:${no ?? ""}`;
}

export default function KenzulNav({ bookName, summaries, variant }: KenzulNavProps) {
  const router = useRouter();
  const closeSheet = useContext(SheetNavContext);
  const isInline = variant === "inline";
  const large = !isInline && closeSheet !== null;
  const isLargeInput = large || isInline;
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isNumeric = /^\d+$/.test(query.trim());
  const nq = isNumeric ? "" : normalizeQuery(query);

  function loadIndex() {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    const order = new Map(summaries.map((s) => [keyOf(s.type, s.no), s.index]));
    fetch("/search-index-kenzul-maarif.json", { cache: "force-cache" })
      .then((res) => res.json())
      .then((data: IndexEntry[]) =>
        setRecords(
          data.map((entry) => {
            const key = keyOf(entry.type, entry.no);
            return {
              key,
              order: order.get(key) ?? Number.MAX_SAFE_INTEGER,
              label: kenzulLabel(entry.type, entry.no),
              href: kenzulHref(entry.type, entry.no),
              title: entry.title,
              normTitle: normalizeText(entry.title),
              texts: entry.text,
              normTexts: entry.text.map(normalizeText),
            };
          }),
        ),
      )
      .catch(() => {
        fetchedRef.current = false;
      })
      .finally(() => setLoading(false));
  }

  // Mobil sheet açılır açılmaz dizini getir; masaüstünde kutuya odaklanınca / kelime yazılınca.
  useEffect(() => {
    if (large || nq) loadIndex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [large, nq]);

  const fuse = useMemo(() => {
    if (!records) return null;
    return new Fuse(records, {
      keys: FUSE_KEYS,
      threshold: FUZZY_THRESHOLD,
      includeMatches: true,
      ignoreLocation: true,
      minMatchCharLength: MIN_MATCH_CHARS,
    });
  }, [records]);

  const { hits, total } = useMemo((): { hits: SearchHit[]; total: number } => {
    const q = query.trim();
    if (!q) return { hits: [], total: 0 };

    // (a) numara: önce bahis, sonra manzume tam eşleşmesi, ardından önek eşleşmeleri
    if (isNumeric) {
      const n = parseInt(q, 10);
      const toHit = (s: KenzulSummary): SearchHit => ({
        id: keyOf(s.type, s.no),
        recordKey: keyOf(s.type, s.no),
        label: kenzulLabel(s.type, s.no),
        href: s.href,
        quote: s.title,
        exact: true,
      });
      const all = [
        ...summaries.filter((s) => s.type === "bahis" && s.no === n),
        ...summaries.filter((s) => s.type === "manzume" && s.no === n),
        ...summaries.filter((s) => s.no !== null && s.no !== n && String(s.no).startsWith(q)),
      ].map(toHit);
      return { hits: all.slice(0, MAX_HITS), total: all.length };
    }

    if (!nq) return { hits: [], total: 0 };
    // Dizin gelene kadar başlık filtresi anında çalışır.
    if (!records) {
      const all = summaries
        .filter((s) => normalizeText(s.title).includes(nq))
        .map<SearchHit>((s) => ({
          id: keyOf(s.type, s.no),
          recordKey: keyOf(s.type, s.no),
          label: kenzulLabel(s.type, s.no),
          href: s.href,
          quote: s.title,
          exact: true,
        }));
      return { hits: all.slice(0, MAX_HITS), total: all.length };
    }
    // (b) birebir (başlık dâhil), okuma sırasında; (c) bulanık
    const exact = exactHits(records, nq, { perRecord: PER_RECORD, snippet: true, limit: MAX_HITS + 1 });
    const seen = new Set(exact.map((h) => h.recordKey));
    const fuzzy =
      fuse && exact.length <= MAX_HITS
        ? fuzzyHits(fuse, nq, seen, MAX_HITS + 1 - exact.length, true)
        : [];
    const all = [...exact, ...fuzzy];
    return { hits: all.slice(0, MAX_HITS), total: all.length };
  }, [query, isNumeric, nq, summaries, records, fuse]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goTo(hit: SearchHit) {
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    router.push(isNumeric ? hit.href : withQuery(hit.href, nq));
    closeSheet?.();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      const target = hits[activeIndex >= 0 ? activeIndex : 0];
      if (target) goTo(target);
    }
  }

  return (
    <div
      className={`w-full font-sans text-sm ${
        large ? "flex min-h-0 flex-1 flex-col" : isInline ? "mx-auto max-w-2xl" : ""
      }`}
      ref={containerRef}
    >
      {!isInline && (
        <>
          <p className="mb-1 truncate font-serif text-xs text-ink-muted">{bookName}</p>
          <Link
            href={bookHref("kenzul-maarif")}
            onClick={() => closeSheet?.()}
            className={`mb-4 block text-ink hover:text-accent ${large ? "text-base" : "text-xs"}`}
          >
            Fihrist
          </Link>
        </>
      )}

      <div className={large ? "flex min-h-0 flex-1 flex-col" : isInline ? "" : "relative"}>
        <label
          htmlFor="kenzul-search"
          className={`mb-1 block text-ink-muted ${isLargeInput ? "text-sm" : "text-xs"}`}
        >
          Ara / git
        </label>
        <input
          id="kenzul-search"
          type="text"
          value={query}
          autoFocus={large}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            loadIndex();
          }}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="no, başlık veya kelime…"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls="kenzul-search-list"
          autoComplete="off"
          className={`w-full rounded border border-border bg-bg-card text-ink outline-none focus:border-accent ${
            isLargeInput ? "px-4 py-3 text-lg" : "px-2 py-1.5"
          }`}
        />
        {loading && (
          <p className={`mt-1 text-ink-muted ${isLargeInput ? "text-sm" : "text-xs"}`}>
            dizin yükleniyor…
          </p>
        )}

        {open && (
          <SearchResults
            hits={hits}
            total={total}
            nq={nq}
            activeIndex={activeIndex}
            large={large}
            inline={isInline}
            listId="kenzul-search-list"
            onPick={goTo}
          />
        )}
      </div>
    </div>
  );
}
