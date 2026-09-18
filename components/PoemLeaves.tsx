"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Highlighted from "@/components/Highlighted";
import { useHighlightQuery } from "@/components/QueryHighlight";
import { matchRanges } from "@/lib/search";

const BLOCKS_PER_LEAF = 12;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 18;
const RESIZE_DEBOUNCE_MS = 100;
const SAFETY_MARGIN = 0.97;
/** Asılı girinti (`pl-5 indent-[-1.25em]`) mısra genişliğinden çıkarılmalı — bkz. hesaplama. */
const HANGING_INDENT_EM = 1.25;

interface PoemLeavesProps {
  blocks: string[][];
  prevHref: string | null;
  nextHref: string | null;
}

export default function PoemLeaves({
  blocks,
  prevHref,
  nextHref,
}: PoemLeavesProps) {
  const router = useRouter();
  const leaves: string[][][] = [];
  for (let i = 0; i < blocks.length; i += BLOCKS_PER_LEAF) {
    leaves.push(blocks.slice(i, i + BLOCKS_PER_LEAF));
  }

  const [leafIndex, setLeafIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);
  const query = useHighlightQuery();

  // ?q= ile gelindiyse ilk eşleşen mısranın yaprağından başla; yoksa ilk yaprak.
  useEffect(() => {
    let leaf = 0;
    if (query) {
      const blockIdx = blocks.findIndex((block) =>
        block.some((line) => matchRanges(line, query).length > 0),
      );
      if (blockIdx >= 0) leaf = Math.floor(blockIdx / BLOCKS_PER_LEAF);
    }
    setLeafIndex(leaf);
  }, [blocks, query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        if (leafIndex > 0) {
          setLeafIndex((i) => i - 1);
        } else if (prevHref) {
          router.push(prevHref);
        }
      } else if (e.key === "ArrowRight") {
        if (leafIndex < leaves.length - 1) {
          setLeafIndex((i) => i + 1);
        } else if (nextHref) {
          router.push(nextHref);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [leafIndex, leaves.length, prevHref, nextHref, router]);

  const currentLeaf = leaves[leafIndex] ?? [];
  const currentLines = currentLeaf.flat();

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measureEl = measureRef.current;
    if (!container || !measureEl || currentLines.length === 0) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    function recompute() {
      const container = containerRef.current;
      const measureEl = measureRef.current;
      if (!container || !measureEl || !ctx || cancelled) return;

      const style = getComputedStyle(measureEl);
      // Kapsayıcının padding'lerini (px-2/sm:px-0) ve asılı girintiyi
      // (pl-5 = 1.25rem, rem bazlı olduğundan font-size'dan bağımsız)
      // kullanılabilir genişlikten düş — ölçüm gerçek render alanıyla eşleşsin.
      const containerStyle = getComputedStyle(container);
      const containerWidth =
        container.clientWidth -
        parseFloat(containerStyle.paddingLeft) -
        parseFloat(containerStyle.paddingRight);
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const hangingIndentPx = HANGING_INDENT_EM * rootFontSize;
      const availableWidth = containerWidth - hangingIndentPx;
      if (availableWidth <= 0) return;

      ctx.font = `${style.fontStyle} ${style.fontWeight} ${MAX_FONT_SIZE}px ${style.fontFamily}`;

      let longestWidth = 0;
      for (const line of currentLines) {
        const width = ctx.measureText(line).width;
        if (width > longestWidth) longestWidth = width;
      }
      if (longestWidth <= 0) return;

      const computed =
        MAX_FONT_SIZE * (availableWidth / longestWidth) * SAFETY_MARGIN;
      const clamped = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, computed));
      setFontSize(clamped);
    }

    function scheduleRecompute() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(recompute, RESIZE_DEBOUNCE_MS);
    }

    // Lora yüklenmeden ölçülürse yedek fontla yanlış genişlik hesaplanır.
    document.fonts.load(`${MAX_FONT_SIZE}px Lora`).catch(() => {});
    recompute();
    document.fonts.ready.then(() => {
      if (!cancelled) recompute();
    });

    const resizeObserver = new ResizeObserver(scheduleRecompute);
    resizeObserver.observe(container);

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLines.join("\n")]);

  return (
    <div>
      <div
        ref={containerRef}
        className="mx-auto max-w-full space-y-6 px-2 text-left font-serif text-ink sm:px-0"
        style={{
          fontSize: fontSize ? `${fontSize}px` : undefined,
          visibility: fontSize ? "visible" : "hidden",
        }}
      >
        {/* Ölçüm için görünmez referans metin — gerçek font ile eşleşir */}
        <span
          ref={measureRef}
          aria-hidden
          className="pointer-events-none absolute -z-10 whitespace-nowrap opacity-0"
        >
          measure
        </span>

        {currentLeaf.map((block, i) => (
          <div key={i} className="space-y-1">
            {block.map((line, j) => (
              <p key={j} className="pl-5 indent-[-1.25em]">
                <Highlighted text={line} scroll />
              </p>
            ))}
          </div>
        ))}
      </div>

      {leaves.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4 font-sans text-sm text-ink-muted">
          <button
            type="button"
            aria-label="Önceki yaprak"
            disabled={leafIndex === 0}
            onClick={() => setLeafIndex((i) => Math.max(0, i - 1))}
            className="disabled:opacity-30"
          >
            ←
          </button>
          <span>
            Yaprak {leafIndex + 1} / {leaves.length}
          </span>
          <button
            type="button"
            aria-label="Sonraki yaprak"
            disabled={leafIndex === leaves.length - 1}
            onClick={() =>
              setLeafIndex((i) => Math.min(leaves.length - 1, i + 1))
            }
            className="disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
