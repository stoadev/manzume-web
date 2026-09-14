"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import ArabicPages from "@/components/ArabicPages";
import PoemLeaves from "@/components/PoemLeaves";
import type { ArapcaInfo, Poem, Section } from "@/lib/data";

/** Okuyucunun "Arapça nüsha" tercihi manzumeler arasında korunur (localStorage). */
const STORAGE_KEY = "arapca-nusha-acik";
const listeners = new Set<() => void>();

function readPref(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writePref(open: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

interface PoemViewProps {
  poem: Poem;
  section: Section | null;
  arapca: ArapcaInfo | null;
  prevHref: string | null;
  nextHref: string | null;
}

export default function PoemView({
  poem,
  section,
  arapca,
  prevHref,
  nextHref,
}: PoemViewProps) {
  // Sunucu/ilk hidrasyonda kapalı; tarayıcıda kayıtlı tercih okunur.
  const arabicOpen = useSyncExternalStore(subscribe, readPref, () => false);

  const arabicRef = useRef<HTMLDivElement>(null);
  // Yalnızca düğmeyle açıldığında kaydır; sayfa yüklenirken kayıtlı tercihle açılırsa kaydırma.
  const scrollOnOpen = useRef(false);

  function toggleArabic() {
    scrollOnOpen.current = !arabicOpen;
    writePref(!arabicOpen);
  }

  const showArabic = arabicOpen && arapca !== null;

  useEffect(() => {
    if (!showArabic || !scrollOnOpen.current) return;
    scrollOnOpen.current = false;
    arabicRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showArabic]);

  return (
    <div
      className={
        showArabic
          ? "mx-auto max-w-2xl px-3 py-10 pb-36 sm:px-6 lg:pb-10 xl:grid xl:max-w-6xl xl:grid-cols-2 xl:items-start xl:gap-6"
          : "mx-auto max-w-2xl px-3 py-10 pb-36 sm:px-6 lg:pb-10"
      }
    >
      <div className="rounded-lg border border-border bg-bg-card px-4 py-10 shadow-sm sm:px-12 sm:py-14">
        <div className="mb-6 flex items-center justify-between gap-3 font-sans text-xs text-ink-muted">
          <span className="tracking-wide text-accent uppercase">
            {section?.name}
          </span>
          {arapca && (
            <button
              type="button"
              onClick={toggleArabic}
              aria-pressed={showArabic}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 px-3.5 py-1.5 font-sans text-xs font-medium text-accent transition-colors hover:bg-accent/20 aria-pressed:bg-accent aria-pressed:text-bg-card"
            >
              {showArabic ? "Arapça nüshayı gizle" : "Arapça nüshayı göster"}
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className={`h-3.5 w-3.5 transition-transform ${showArabic ? "rotate-180" : ""}`}
              >
                <path
                  d="M3.5 6l4.5 4.5L12.5 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        <h2 className="mb-8 text-center font-sans text-sm text-ink-muted">
          Manzume {poem.no}
        </h2>

        <PoemLeaves
          blocks={poem.blocks}
          prevHref={prevHref}
          nextHref={nextHref}
        />
      </div>

      {showArabic && (
        <div ref={arabicRef} className="mt-6 scroll-mt-4 xl:mt-0">
          <ArabicPages info={arapca} no={poem.no} />
        </div>
      )}
    </div>
  );
}
