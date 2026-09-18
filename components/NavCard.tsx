"use client";

import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import SearchResults from "@/components/SearchResults";
import type { BookMeta, PoemSummary } from "@/lib/data";
import { poemHref } from "@/lib/routes";
import { normalizeText } from "@/lib/normalize";
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

interface NavCardProps {
  slug: string;
  book: BookMeta;
  poems: PoemSummary[];
  onNavigate?: () => void;
  autoFocus?: boolean;
  size?: "compact" | "large";
}

interface SearchIndexEntry {
  no: string;
  firstLine: string | null;
  lines: string[];
}

export default function NavCard({
  slug,
  book,
  poems,
  onNavigate,
  autoFocus = false,
  size = "compact",
}: NavCardProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const large = size === "large";

  const isNumeric = /^\d/.test(query.trim());
  const nq = isNumeric ? "" : normalizeQuery(query);

  function loadIndex() {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    const order = new Map(poems.map((p) => [p.no, p.sortKey]));
    fetch("/search-index.json", { cache: "force-cache" })
      .then((res) => res.json())
      .then((data: SearchIndexEntry[]) =>
        setRecords(
          data.map((entry) => ({
            key: entry.no,
            order: order.get(entry.no) ?? Number.MAX_SAFE_INTEGER,
            label: `Manzume ${entry.no}`,
            href: poemHref(slug, entry.no),
            texts: entry.lines,
            normTexts: entry.lines.map(normalizeText),
          })),
        ),
      )
      .catch(() => {
        fetchedRef.current = false;
      })
      .finally(() => setLoading(false));
  }

  // Mobil sheet açılır açılmaz dizini getir; masaüstünde kutuya odaklanınca / kelime yazılınca.
  useEffect(() => {
    if (autoFocus || nq) loadIndex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, nq]);

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

    // (a) numara: "12" → 12 ve 12-A, sıra sortKey
    if (isNumeric) {
      const all = poems
        .filter((p) => p.no.replace("-A", "") === q)
        .sort((a, b) => a.sortKey - b.sortKey)
        .map<SearchHit>((p) => ({
          id: p.no,
          recordKey: p.no,
          label: `Manzume ${p.no}`,
          href: poemHref(slug, p.no),
          quote: p.firstLine ?? "",
          exact: true,
        }));
      return { hits: all.slice(0, MAX_HITS), total: all.length };
    }

    if (!records || !nq) return { hits: [], total: 0 };
    // (b) birebir: her eşleşen mısra ayrı satır, kitap sırasında
    const exact = exactHits(records, nq, { perRecord: Infinity, snippet: false, limit: MAX_HITS + 1 });
    // (c) bulanık: birebir eşleşmeyen kayıtlar
    const seen = new Set(exact.map((h) => h.recordKey));
    const fuzzy =
      fuse && exact.length <= MAX_HITS
        ? fuzzyHits(fuse, nq, seen, MAX_HITS + 1 - exact.length, false)
        : [];
    const all = [...exact, ...fuzzy];
    return { hits: all.slice(0, MAX_HITS), total: all.length };
  }, [query, isNumeric, nq, poems, slug, records, fuse]);

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
    setError(false);
    setActiveIndex(-1);
    router.push(isNumeric ? hit.href : withQuery(hit.href, nq));
    onNavigate?.();
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
      if (activeIndex >= 0 && hits[activeIndex]) {
        goTo(hits[activeIndex]);
        return;
      }
      if (isNumeric) {
        const base = query.trim();
        const found = poems.find((p) => p.no === base || p.no.replace("-A", "") === base);
        if (found) {
          goTo({
            id: found.no,
            recordKey: found.no,
            label: "",
            href: poemHref(slug, found.no),
            quote: "",
            exact: true,
          });
        } else {
          setError(true);
        }
      } else if (hits[0]) {
        goTo(hits[0]);
      }
    }
  }

  return (
    <div
      className={`w-full font-sans text-sm ${large ? "flex min-h-0 flex-1 flex-col" : ""}`}
      ref={containerRef}
    >
      <p className="mb-4 truncate font-serif text-xs text-ink-muted">{book.name}</p>

      <div className={large ? "flex min-h-0 flex-1 flex-col" : "relative"}>
        <label
          htmlFor="nav-search"
          className={`mb-1 block text-ink-muted ${large ? "text-sm" : "text-xs"}`}
        >
          Manzume ara / git
        </label>
        <input
          id="nav-search"
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(false);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            loadIndex();
          }}
          onKeyDown={onKeyDown}
          placeholder="no veya kelime…"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls="nav-search-list"
          autoComplete="off"
          className={`w-full rounded border bg-bg text-ink outline-none focus:border-accent ${
            error ? "border-red-500" : "border-border"
          } ${large ? "px-4 py-3 text-lg" : "px-2 py-1.5"}`}
        />
        {error && (
          <p className={`mt-1 text-red-500 ${large ? "text-sm" : "text-xs"}`}>
            Manzume bulunamadı.
          </p>
        )}
        {loading && (
          <p className={`mt-1 text-ink-muted ${large ? "text-sm" : "text-xs"}`}>
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
            listId="nav-search-list"
            onPick={goTo}
          />
        )}
      </div>
    </div>
  );
}
