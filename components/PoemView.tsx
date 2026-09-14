"use client";

import { useSyncExternalStore } from "react";
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

  function toggleArabic() {
    writePref(!arabicOpen);
  }

  const showArabic = arabicOpen && arapca !== null;

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
              className="rounded-full border border-border px-3 py-1 font-sans text-xs text-ink-muted transition-colors hover:border-accent hover:text-accent aria-pressed:border-accent aria-pressed:text-accent"
            >
              {showArabic ? "Arapça nüshayı gizle" : "Arapça nüsha"}
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
        <div className="mt-6 xl:mt-0">
          <ArabicPages info={arapca} no={poem.no} />
        </div>
      )}
    </div>
  );
}
