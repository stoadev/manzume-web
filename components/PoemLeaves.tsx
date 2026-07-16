"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BLOCKS_PER_LEAF = 12;

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

  useEffect(() => {
    setLeafIndex(0);
  }, [blocks]);

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

  return (
    <div>
      <div className="mx-auto w-fit max-w-full space-y-6 text-left font-serif text-lg text-ink">
        {currentLeaf.map((block, i) => (
          <div key={i} className="space-y-1">
            {block.map((line, j) => (
              <p key={j}>{line}</p>
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
