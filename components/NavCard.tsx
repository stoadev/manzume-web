"use client";

import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BookMeta, PoemSummary } from "@/lib/data";
import { normalizeText } from "@/lib/normalize";

interface NavCardProps {
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

interface Suggestion {
  no: string;
  label: string;
}

const MAX_SUGGESTIONS = 8;

export default function NavCard({
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
  const [textIndex, setTextIndex] = useState<SearchIndexEntry[] | null>(null);
  const fetchedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const large = size === "large";

  const isNumeric = /^\d/.test(query.trim());

  useEffect(() => {
    if (isNumeric || fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/search-index.json")
      .then((res) => res.json())
      .then((data: SearchIndexEntry[]) => setTextIndex(data))
      .catch(() => {
        fetchedRef.current = false;
      });
  }, [isNumeric]);

  const fuse = useMemo(() => {
    if (!textIndex) return null;
    return new Fuse(
      textIndex.map((entry) => ({
        no: entry.no,
        firstLine: entry.firstLine ?? "",
        text: entry.lines.map(normalizeText).join(" • "),
      })),
      {
        keys: ["text"],
        threshold: 0.35,
        ignoreLocation: true,
      },
    );
  }, [textIndex]);

  const suggestions: Suggestion[] = useMemo(() => {
    const q = query.trim();
    if (!q) return [];

    if (isNumeric) {
      const exact: (Suggestion & { sortKey: number })[] = [];
      const prefix: (Suggestion & { sortKey: number })[] = [];
      for (const p of poems) {
        const base = p.no.replace("-A", "");
        const entry = { no: p.no, label: `${p.no} · ${p.firstLine ?? ""}`, sortKey: p.sortKey };
        if (base === q) {
          exact.push(entry);
        } else if (base.startsWith(q)) {
          prefix.push(entry);
        }
      }
      exact.sort((a, b) => a.sortKey - b.sortKey);
      prefix.sort((a, b) => a.sortKey - b.sortKey);
      return [...exact, ...prefix].slice(0, MAX_SUGGESTIONS);
    }

    if (!fuse) return [];
    const normalizedQuery = normalizeText(q);
    return fuse
      .search(normalizedQuery)
      .slice(0, MAX_SUGGESTIONS)
      .map((result) => {
        const lines = textIndex?.find((e) => e.no === result.item.no)?.lines ?? [];
        const match =
          lines.find((line) => normalizeText(line).includes(normalizedQuery)) ??
          result.item.firstLine;
        return { no: result.item.no, label: `${result.item.no} · ${match}` };
      });
  }, [query, isNumeric, poems, fuse, textIndex]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goTo(no: string) {
    setQuery("");
    setOpen(false);
    setError(false);
    router.push(`/manzume/${no}`);
    onNavigate?.();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        goTo(suggestions[activeIndex].no);
        return;
      }
      const base = query.trim();
      const found = poems.find((p) => p.no === base || p.no.replace("-A", "") === base);
      if (found) {
        goTo(found.no);
      } else {
        setError(true);
      }
    }
  }

  return (
    <div className="w-full font-sans text-sm" ref={containerRef}>
      <p className="mb-4 truncate font-serif text-xs text-ink-muted">{book.name}</p>

      <div className="relative">
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
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="no veya kelime…"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
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

        {open && suggestions.length > 0 && (
          <ul
            id="nav-search-list"
            role="listbox"
            className={`absolute z-10 mt-1 w-full overflow-y-auto rounded border border-border bg-bg-card shadow-sm ${
              large ? "max-h-[60vh]" : "max-h-64"
            }`}
          >
            {suggestions.map((s, i) => (
              <li key={s.no} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goTo(s.no)}
                  className={`block w-full truncate text-left ${
                    i === activeIndex ? "bg-bg text-accent" : "text-ink"
                  } ${large ? "px-4 py-3 text-base" : "px-2 py-1.5"}`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
