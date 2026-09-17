"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useEffect, useState } from "react";
import NavCard from "@/components/NavCard";
import type { BookMeta, PoemSummary } from "@/lib/data";

/** Mobil sheet içindeki özel nav, gezinince sheet'i kapatmak için bunu çağırır. */
export const SheetNavContext = createContext<(() => void) | null>(null);

interface ReaderShellProps {
  slug: string;
  book: BookMeta;
  poems?: PoemSummary[];
  index: number;
  total: number;
  prevHref: string | null;
  nextHref: string | null;
  /** Konum çipi metni; varsayılan "Manzume {index+1} / {total}". */
  positionLabel?: string;
  /** Mobil alt bardaki orta düğme etiketi; varsayılan "Manzume Bul". */
  findLabel?: string;
  /** Verilirse yan kartta ve mobil sheet'te NavCard yerine bu render edilir. */
  nav?: React.ReactNode;
  children: React.ReactNode;
}

export default function ReaderShell({
  slug,
  book,
  poems,
  index,
  total,
  prevHref,
  nextHref,
  positionLabel,
  findLabel = "Manzume Bul",
  nav,
  children,
}: ReaderShellProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const position = positionLabel ?? `Manzume ${index + 1} / ${total}`;
  const closeSheet = () => setSheetOpen(false);

  useEffect(() => {
    if (!sheetOpen) return;

    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSheetOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sheetOpen]);

  return (
    <div className="relative min-h-screen lg:pr-64">
      {/* Masaüstü kenar okları */}
      <button
        type="button"
        aria-label="Önceki"
        disabled={!prevHref}
        onClick={() => prevHref && router.push(prevHref)}
        className="fixed top-1/2 left-2 z-30 hidden -translate-y-1/2 rounded-full p-3 font-sans text-2xl text-ink-muted opacity-40 transition-opacity hover:opacity-100 disabled:opacity-0 md:block"
      >
        ←
      </button>
      <button
        type="button"
        aria-label="Sonraki"
        disabled={!nextHref}
        onClick={() => nextHref && router.push(nextHref)}
        className="fixed top-1/2 right-2 z-30 hidden -translate-y-1/2 rounded-full p-3 font-sans text-2xl text-ink-muted opacity-40 transition-opacity hover:opacity-100 disabled:opacity-0 md:block lg:right-[17rem]"
      >
        →
      </button>

      {/* Masaüstü konum göstergesi */}
      <div className="fixed bottom-4 right-4 z-30 hidden rounded-full border border-border bg-bg-card px-3 py-1 font-sans text-xs text-ink-muted md:block lg:right-[17rem]">
        {position}
      </div>

      {children}

      {/* Masaüstü sabit yan kart */}
      <div className="fixed top-1/2 right-4 z-30 hidden w-56 -translate-y-1/2 rounded-lg border border-border bg-bg-card px-4 py-5 shadow-sm lg:block">
        <Link
          href="/"
          className="mb-3 block font-sans text-xs text-ink-muted hover:text-accent"
        >
          ← Kütüphane
        </Link>
        {nav ?? <NavCard slug={slug} book={book} poems={poems ?? []} />}
      </div>

      {/* Mobil: konum çipi + tam genişlik alt bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center border-t border-border bg-bg-card px-4 pt-1.5">
          <span className="rounded-full font-sans text-xs text-ink-muted">
            {position}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
          <button
            type="button"
            aria-label="Önceki"
            disabled={!prevHref}
            onClick={() => prevHref && router.push(prevHref)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 bg-bg-card px-2 py-2 font-sans text-sm text-ink disabled:text-ink-muted disabled:opacity-40"
          >
            <span className="text-xl leading-none">←</span>
            <span>Önceki</span>
          </button>
          <button
            type="button"
            aria-label={findLabel}
            onClick={() => setSheetOpen(true)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 bg-bg-card px-2 py-2 font-sans text-sm text-ink"
          >
            <span className="text-xl leading-none">🔍</span>
            <span>{findLabel}</span>
          </button>
          <button
            type="button"
            aria-label="Sonraki"
            disabled={!nextHref}
            onClick={() => nextHref && router.push(nextHref)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 bg-bg-card px-2 py-2 font-sans text-sm text-ink disabled:text-ink-muted disabled:opacity-40"
          >
            <span className="text-xl leading-none">→</span>
            <span>Sonraki</span>
          </button>
        </div>
      </div>

      {/* Mobil: tam ekran arama sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                onClick={() => setSheetOpen(false)}
                className="font-sans text-xs text-ink-muted hover:text-accent"
              >
                ← Kütüphane
              </Link>
              <span className="font-serif text-sm text-ink-muted">{findLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="rounded border border-border px-3 py-2 font-sans text-sm text-ink"
            >
              Kapat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {nav ? (
              <SheetNavContext.Provider value={closeSheet}>{nav}</SheetNavContext.Provider>
            ) : (
              <NavCard
                slug={slug}
                book={book}
                poems={poems ?? []}
                onNavigate={closeSheet}
                autoFocus
                size="large"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
