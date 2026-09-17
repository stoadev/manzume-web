"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { SheetNavContext } from "@/components/ReaderShell";
import type { KenzulSummary } from "@/lib/kenzul";
import { normalizeText } from "@/lib/normalize";
import { bookHref, kenzulLabel } from "@/lib/routes";

interface KenzulNavProps {
  bookName: string;
  summaries: KenzulSummary[];
}

const MAX_RESULTS = 12;

export default function KenzulNav({ bookName, summaries }: KenzulNavProps) {
  const router = useRouter();
  const closeSheet = useContext(SheetNavContext);
  const large = closeSheet !== null;
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    if (/^\d+$/.test(q)) {
      const n = parseInt(q, 10);
      const bahis = summaries.filter((s) => s.type === "bahis" && s.no === n);
      const manzume = summaries.filter((s) => s.type === "manzume" && s.no === n);
      const prefix = summaries.filter(
        (s) => s.no !== null && s.no !== n && String(s.no).startsWith(q),
      );
      return [...bahis, ...manzume, ...prefix].slice(0, MAX_RESULTS);
    }
    const nq = normalizeText(q);
    return summaries
      .filter((s) => normalizeText(s.title).includes(nq))
      .slice(0, MAX_RESULTS);
  }, [query, summaries]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goTo(href: string) {
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    router.push(href);
    closeSheet?.();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      const target = results[activeIndex >= 0 ? activeIndex : 0];
      if (target) goTo(target.href);
    }
  }

  return (
    <div className="w-full font-sans text-sm" ref={containerRef}>
      <p className="mb-1 truncate font-serif text-xs text-ink-muted">{bookName}</p>
      <Link
        href={bookHref("kenzul-maarif")}
        onClick={() => closeSheet?.()}
        className={`mb-4 block text-ink hover:text-accent ${large ? "text-base" : "text-xs"}`}
      >
        Fihrist
      </Link>

      <div className="relative">
        <label
          htmlFor="kenzul-search"
          className={`mb-1 block text-ink-muted ${large ? "text-sm" : "text-xs"}`}
        >
          Başlık veya numara
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
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="no veya başlık…"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="kenzul-search-list"
          autoComplete="off"
          className={`w-full rounded border border-border bg-bg text-ink outline-none focus:border-accent ${
            large ? "px-4 py-3 text-lg" : "px-2 py-1.5"
          }`}
        />

        {open && results.length > 0 && (
          <ul
            id="kenzul-search-list"
            role="listbox"
            className={`absolute z-10 mt-1 w-full overflow-y-auto rounded border border-border bg-bg-card shadow-sm ${
              large ? "max-h-[60vh]" : "max-h-64"
            }`}
          >
            {results.map((s, i) => (
              <li key={s.href} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goTo(s.href)}
                  className={`block w-full truncate text-left ${
                    i === activeIndex ? "bg-bg text-accent" : "text-ink"
                  } ${large ? "px-4 py-3 text-base" : "px-2 py-1.5"}`}
                >
                  {kenzulLabel(s.type, s.no)} · {s.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
