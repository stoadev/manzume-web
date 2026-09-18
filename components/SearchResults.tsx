"use client";

import Highlighted from "@/components/Highlighted";
import { countLabel, type SearchHit } from "@/lib/search";

interface SearchResultsProps {
  hits: SearchHit[];
  /** Sınır uygulanmadan önceki toplam (50+ göstergesi için). */
  total: number;
  /** Alıntı içinde vurgulanacak normalize sorgu. */
  nq: string;
  activeIndex: number;
  /** Mobil sheet: liste satır içi ve kalan yüksekliği kaydırarak kullanır. */
  large?: boolean;
  /** Fihrist sayfası: liste sayfa akışında ve tam açılır (sayfa kaydırılır). */
  inline?: boolean;
  listId: string;
  onPick: (hit: SearchHit) => void;
}

/** İki kitabın arama kutularının ortak sonuç listesi. */
export default function SearchResults({
  hits,
  total,
  nq,
  activeIndex,
  large = false,
  inline = false,
  listId,
  onPick,
}: SearchResultsProps) {
  if (hits.length === 0) return null;
  const isLarge = large || inline;
  return (
    <div
      className={
        inline
          ? "mt-2 w-full rounded border border-border bg-bg-card shadow-sm"
          : large
            ? "mt-2 flex min-h-0 flex-1 flex-col"
            : "absolute z-10 mt-1 w-full rounded border border-border bg-bg-card shadow-sm"
      }
    >
      <ul
        id={listId}
        role="listbox"
        style={{ WebkitOverflowScrolling: "touch" }}
        className={`divide-y divide-border ${
          inline
            ? ""
            : large
              ? "min-h-0 flex-1 overflow-y-auto rounded border border-border bg-bg-card"
              : "max-h-[60vh] overflow-y-auto"
        }`}
      >
        {hits.map((h, i) => (
          <li key={h.id} role="option" aria-selected={i === activeIndex}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(h)}
              className={`block min-h-[44px] w-full text-left ${
                i === activeIndex ? "bg-bg" : ""
              } ${isLarge ? "px-4 py-3" : "px-2 py-2"}`}
            >
              <span className={`line-clamp-2 font-serif text-ink ${isLarge ? "text-base" : "text-sm"}`}>
                <span className="mr-1 font-sans text-xs text-accent">{h.label}:</span>
                <Highlighted text={h.quote} q={h.exact ? nq : ""} />
              </span>
              {h.sub && (
                <span className="line-clamp-2 font-sans text-xs text-ink-muted">{h.sub}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className={`px-2 py-1.5 font-sans text-xs text-ink-muted ${isLarge ? "px-4" : ""}`}>
        {countLabel(total)}
      </p>
    </div>
  );
}
