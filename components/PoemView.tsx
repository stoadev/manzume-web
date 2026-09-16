"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import OsmanlicaPages from "@/components/OsmanlicaPages";
import PoemLeaves from "@/components/PoemLeaves";
import type { OsmanlicaInfo, Poem, Section } from "@/lib/data";

/**
 * "Osmanlıca nüsha" açık/kapalı durumu:
 * - Geniş ekranda (xl, yan yana) tercih localStorage'da tutulur; manzumeler arasında korunur
 *   çünkü sağ sütun her zaman görünür.
 * - Dar ekranda (alt alta) yalnızca o anki manzume için geçerlidir; sonraki manzumede kapalı
 *   gelir — açık kalsaydı sayfanın altında görünmeden dururdu.
 */
const STORAGE_KEY = "osmanlica-nusha-acik";
/** Tailwind `xl` kırılımı — PoemView'daki yan yana yerleşimle aynı. */
const WIDE_QUERY = "(min-width: 80rem)";
/** Yapışkan kartın ekran kenarına bıraktığı boşluk (px). */
const STICKY_GAP = 16;
const listeners = new Set<() => void>();
let narrowOpen = false;

function isWide(): boolean {
  return window.matchMedia(WIDE_QUERY).matches;
}

function notify() {
  listeners.forEach((l) => l());
}

function readPref(): boolean {
  if (!isWide()) return narrowOpen;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writePref(open: boolean) {
  narrowOpen = open;
  if (isWide()) {
    try {
      localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    } catch {}
  }
  notify();
}

function resetNarrow() {
  if (!narrowOpen) return;
  narrowOpen = false;
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  const media = window.matchMedia(WIDE_QUERY);
  media.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    media.removeEventListener("change", listener);
  };
}

interface PoemViewProps {
  poem: Poem;
  section: Section | null;
  osmanlica: OsmanlicaInfo | null;
  prevHref: string | null;
  nextHref: string | null;
}

export default function PoemView({
  poem,
  section,
  osmanlica,
  prevHref,
  nextHref,
}: PoemViewProps) {
  // Sunucu/ilk hidrasyonda kapalı; tarayıcıda kayıtlı tercih okunur.
  const osmanlicaOpen = useSyncExternalStore(subscribe, readPref, () => false);

  const osmanlicaRef = useRef<HTMLDivElement>(null);
  // Yalnızca düğmeyle açıldığında kaydır; sayfa yüklenirken kayıtlı tercihle açılırsa kaydırma.
  const scrollOnOpen = useRef(false);

  function toggleOsmanlica() {
    scrollOnOpen.current = !osmanlicaOpen;
    writePref(!osmanlicaOpen);
  }

  const showOsmanlica = osmanlicaOpen && osmanlica !== null;

  // Dar ekranda manzume değişince Osmanlıca bölümü kapat.
  useEffect(() => {
    resetNarrow();
  }, [poem.no]);

  useEffect(() => {
    if (!showOsmanlica || !scrollOnOpen.current) return;
    scrollOnOpen.current = false;
    osmanlicaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showOsmanlica]);

  // Yan yana modda (xl) Türkçe kart yapışkan: ekrandan kısaysa üstten, uzunsa
  // altı ekranın altına gelince asılı kalır; sağdaki Osmanlıca sayfalar kaymaya devam eder.
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const card = cardRef.current;
    if (!showOsmanlica || !card) return;

    function update() {
      if (!card) return;
      const top = Math.min(STICKY_GAP, window.innerHeight - card.offsetHeight - STICKY_GAP);
      card.style.top = `${top}px`;
    }
    update();
    const observer = new ResizeObserver(update);
    observer.observe(card);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      card.style.top = "";
    };
  }, [showOsmanlica]);

  return (
    <div
      className={
        showOsmanlica
          ? "mx-auto max-w-2xl px-3 py-10 pb-36 sm:px-6 lg:pb-10 xl:grid xl:max-w-6xl xl:grid-cols-2 xl:items-start xl:gap-6"
          : "mx-auto max-w-2xl px-3 py-10 pb-36 sm:px-6 lg:pb-10"
      }
    >
      <div
        ref={cardRef}
        className={`rounded-lg border border-border bg-bg-card px-4 py-10 shadow-sm sm:px-12 sm:py-14${showOsmanlica ? " xl:sticky" : ""}`}
      >
        <div className="mb-6 flex items-center justify-between gap-3 font-sans text-xs text-ink-muted">
          <span className="tracking-wide text-accent uppercase">
            {section?.name}
          </span>
          {osmanlica && (
            <button
              type="button"
              onClick={toggleOsmanlica}
              aria-pressed={showOsmanlica}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 px-3.5 py-1.5 font-sans text-xs font-medium text-accent transition-colors hover:bg-accent/20 aria-pressed:bg-accent aria-pressed:text-bg-card"
            >
              {showOsmanlica ? "Osmanlıca nüshayı gizle" : "Osmanlıca nüshayı göster"}
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className={`h-3.5 w-3.5 transition-transform ${showOsmanlica ? "rotate-180" : ""}`}
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

      {showOsmanlica && (
        <div ref={osmanlicaRef} className="mt-6 scroll-mt-4 xl:mt-0">
          <OsmanlicaPages info={osmanlica} no={poem.no} />
        </div>
      )}
    </div>
  );
}
