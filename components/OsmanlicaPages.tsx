"use client";

import { useEffect, useState } from "react";
import type { OsmanlicaInfo, OsmanlicaPage } from "@/lib/data";

/* 150 dpi A4 render — layout kayması olmasın diye sabit oran. */
const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1755;

/**
 * Ana CDN erişilebilir mi? Tarayıcı DNS hatasını 20-30 sn'de bildirdiğinden
 * beklemeden kısa zaman aşımlı bir yoklama yapılır; sonucu oturum boyunca
 * bir kez hesaplanır. Ulaşılamıyorsa görseller doğrudan yedek adresten yüklenir.
 */
const PROBE_TIMEOUT_MS = 2500;
let probe: Promise<boolean> | null = null;

function primaryReachable(url: string): Promise<boolean> {
  if (!probe) {
    const signal =
      typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(PROBE_TIMEOUT_MS) : undefined;
    probe = fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store", signal })
      .then(() => true)
      .catch(() => false);
  }
  return probe;
}

interface OsmanlicaPagesProps {
  info: OsmanlicaInfo;
  no: string;
}

export default function OsmanlicaPages({ info, no }: OsmanlicaPagesProps) {
  const [zoomed, setZoomed] = useState<OsmanlicaPage | null>(null);
  // Ana CDN'den gelmeyen sayfalar önce yedek adresten denenir; o da gelmezse yer tutucu.
  const [fallback, setFallback] = useState<Set<number>>(() => new Set());
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  // null: yoklama sürüyor (görseller henüz istenmez), false: tümü yedekten
  const [primaryOk, setPrimaryOk] = useState<boolean | null>(null);

  const probeUrl = info.pages[0].src;
  useEffect(() => {
    let active = true;
    primaryReachable(probeUrl).then((ok) => {
      if (active) setPrimaryOk(ok);
    });
    return () => {
      active = false;
    };
  }, [probeUrl]);

  function onImageError(page: number) {
    if (fallback.has(page)) {
      setFailed((prev) => (prev.has(page) ? prev : new Set(prev).add(page)));
    } else {
      setFallback((prev) => new Set(prev).add(page));
    }
  }

  function srcFor(p: OsmanlicaPage): string {
    return primaryOk === false || fallback.has(p.page) ? p.fallbackSrc : p.src;
  }

  useEffect(() => {
    if (!zoomed) return;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomed(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [zoomed]);

  const first = info.pages[0];
  const last = info.pages[info.pages.length - 1];
  const range =
    first.printed === null
      ? null
      : first.page === last.page
        ? `s. ${first.printed}`
        : `s. ${first.printed}–${last.printed}`;

  return (
    <section
      aria-label="Osmanlıca nüsha"
      className="rounded-lg border border-border bg-bg-card px-4 py-8 shadow-sm sm:px-8"
    >
      <div className="mb-6 flex items-baseline justify-between gap-3 font-sans text-xs text-ink-muted">
        <span className="tracking-wide text-accent uppercase">Osmanlıca nüsha</span>
        {range && <span>{range}</span>}
      </div>

      {info.guess && (
        <p className="mb-4 font-sans text-xs text-ink-muted">
          Bu manzumenin başlığı Osmanlıca nüshada otomatik okunamadı; sayfa aralığı
          komşu manzumelerden kestirilmiştir.
        </p>
      )}

      <div className="space-y-6">
        {info.pages.map((p) => {
          const others = p.poems.filter((n) => n !== no);
          return (
            <figure key={p.page}>
              {primaryOk === null ? (
                <div
                  aria-hidden
                  style={{ aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}` }}
                  className="w-full rounded border border-border bg-bg"
                />
              ) : failed.has(p.page) ? (
                <div
                  role="img"
                  aria-label={`Sayfa ${p.printed ?? p.page} görseli henüz yüklenemedi`}
                  style={{ aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}` }}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded border border-dashed border-border bg-bg px-6 text-center"
                >
                  <span className="font-serif text-base text-ink-muted">
                    Sayfa {p.printed ?? p.page}
                  </span>
                  <span className="font-sans text-xs text-ink-muted">
                    Osmanlıca nüsha görseli yakında burada görünecek.
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setZoomed(p)}
                  className="block w-full cursor-zoom-in overflow-hidden rounded border border-border bg-white"
                  aria-label={`Sayfa ${p.printed ?? p.page} — büyüt`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- CDN görseli */}
                  <img
                    src={srcFor(p)}
                    alt={`Osmanlıca nüsha, sayfa ${p.printed ?? p.page}`}
                    width={PAGE_WIDTH}
                    height={PAGE_HEIGHT}
                    loading="lazy"
                    decoding="async"
                    onError={() => onImageError(p.page)}
                    className="h-auto w-full"
                  />
                </button>
              )}
              <figcaption className="mt-1.5 flex justify-between font-sans text-xs text-ink-muted">
                <span>{p.printed !== null ? `Sayfa ${p.printed}` : `PDF s. ${p.page}`}</span>
                {others.length > 0 && (
                  <span>Bu sayfada ayrıca: {others.join(", ")}</span>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sayfa büyütülmüş görünüm"
          onClick={() => setZoomed(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-start justify-center overflow-auto bg-black/80 p-3 sm:p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- CDN görseli */}
          <img
            src={srcFor(zoomed)}
            alt={`Osmanlıca nüsha, sayfa ${zoomed.printed ?? zoomed.page}`}
            width={PAGE_WIDTH}
            height={PAGE_HEIGHT}
            className="h-auto w-full max-w-4xl rounded bg-white shadow-lg"
          />
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setZoomed(null)}
            className="fixed top-3 right-3 rounded-full bg-black/60 px-3 py-1 font-sans text-sm text-white"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
