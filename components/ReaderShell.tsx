"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NavCard from "@/components/NavCard";
import type { BookMeta, PoemSummary } from "@/lib/data";

interface ReaderShellProps {
  book: BookMeta;
  poems: PoemSummary[];
  index: number;
  total: number;
  prevHref: string | null;
  nextHref: string | null;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 50;

export default function ReaderShell({
  book,
  poems,
  index,
  total,
  prevHref,
  nextHref,
  children,
}: ReaderShellProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

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

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (dx > SWIPE_THRESHOLD && prevHref) {
      router.push(prevHref);
    } else if (dx < -SWIPE_THRESHOLD && nextHref) {
      router.push(nextHref);
    }
  }

  return (
    <div
      className="relative min-h-screen lg:pr-64"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Masaüstü kenar okları */}
      <button
        type="button"
        aria-label="Önceki manzume"
        disabled={!prevHref}
        onClick={() => prevHref && router.push(prevHref)}
        className="fixed top-1/2 left-2 z-30 hidden -translate-y-1/2 rounded-full p-3 font-sans text-2xl text-ink-muted opacity-40 transition-opacity hover:opacity-100 disabled:opacity-0 md:block"
      >
        ←
      </button>
      <button
        type="button"
        aria-label="Sonraki manzume"
        disabled={!nextHref}
        onClick={() => nextHref && router.push(nextHref)}
        className="fixed top-1/2 right-2 z-30 hidden -translate-y-1/2 rounded-full p-3 font-sans text-2xl text-ink-muted opacity-40 transition-opacity hover:opacity-100 disabled:opacity-0 md:block lg:right-[17rem]"
      >
        →
      </button>

      {/* Masaüstü konum göstergesi */}
      <div className="fixed bottom-4 right-4 z-30 hidden rounded-full border border-border bg-bg-card px-3 py-1 font-sans text-xs text-ink-muted md:block lg:right-[17rem]">
        Manzume {index + 1} / {total}
      </div>

      {children}

      {/* Masaüstü sabit yan kart */}
      <div className="fixed top-1/2 right-4 z-30 hidden w-56 -translate-y-1/2 rounded-lg border border-border bg-bg-card px-4 py-5 shadow-sm lg:block">
        <NavCard book={book} poems={poems} />
      </div>

      {/* Mobil alt bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-border bg-bg-card px-4 py-2 font-sans text-xs text-ink-muted lg:hidden">
        <button
          type="button"
          aria-label="Gezinme kartını aç"
          onClick={() => setSheetOpen(true)}
          className="text-lg"
        >
          ☰
        </button>
        <span>
          Manzume {index + 1} / {total}
        </span>
        <span className="w-6" />
      </div>

      {/* Mobil: alttan açılan sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Gezinme"
            className="relative w-full rounded-t-lg border-t border-border bg-bg-card px-6 py-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-end">
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setSheetOpen(false)}
                className="font-sans text-xl leading-none text-ink-muted hover:text-accent"
              >
                ×
              </button>
            </div>
            <NavCard
              book={book}
              poems={poems}
              onNavigate={() => setSheetOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
