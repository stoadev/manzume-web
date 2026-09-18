"use client";

import { useEffect, useRef } from "react";
import { useHighlightQuery } from "@/components/QueryHighlight";
import { matchRanges } from "@/lib/search";

const ARABIC_TEXT = "[Arapça ibare]";

interface HighlightedProps {
  text: string;
  /** Verilmezse sayfadaki `?q=` (QueryHighlight) kullanılır. */
  q?: string;
  /** true: ilk eşleşmeye sayfa yüklenince kaydır (hedef sayfa); listelerde false. */
  scroll?: boolean;
}

/** Sayfa+sorgu başına yalnızca ilk eşleşen bileşen kaydırır. */
let scrolledFor = "";

/** "[Arapça ibare]" yer tutucusunu vurgulu span'a çevirir (Kenz'il-Maarif). */
function renderPlain(text: string, keyBase: number) {
  const parts = text.split(ARABIC_TEXT);
  if (parts.length === 1) return text;
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <span
            key={`${keyBase}-a${i}`}
            className="italic text-ink-muted"
            title="Kaynak nüshada Arapça metin bulunmuyor"
          >
            {ARABIC_TEXT}
          </span>,
          part,
        ],
  );
}

/**
 * Metni `q` geçtiği yerlerden bölüp `<mark>` ile sarar; `q` boşsa düz metin.
 * Eşleme normalize metin üzerinden yapılır, indeksler orijinal metinde kullanılır.
 */
export default function Highlighted({ text, q, scroll = false }: HighlightedProps) {
  const ctxQ = useHighlightQuery();
  const query = q ?? ctxQ;
  const ranges = query ? matchRanges(text, query) : [];
  const firstMark = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!scroll || !query || !firstMark.current) return;
    const key = `${window.location.pathname}?${query}`;
    if (scrolledFor === key) return;
    scrolledFor = key;
    const el = firstMark.current;
    requestAnimationFrame(() => el.scrollIntoView({ block: "center" }));
  }, [scroll, query, ranges.length]);

  if (ranges.length === 0) return <>{renderPlain(text, 0)}</>;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([s, e], i) => {
    if (s > cursor) nodes.push(renderPlain(text.slice(cursor, s), i));
    nodes.push(
      <mark key={`m${i}`} ref={i === 0 ? firstMark : undefined} className="search-hit">
        {text.slice(s, e)}
      </mark>,
    );
    cursor = e;
  });
  if (cursor < text.length) nodes.push(renderPlain(text.slice(cursor), ranges.length));
  return <>{nodes}</>;
}
