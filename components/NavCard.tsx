"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BookMeta, PoemSummary } from "@/lib/data";

interface NavCardProps {
  book: BookMeta;
  poems: PoemSummary[];
  onNavigate?: () => void;
}

export default function NavCard({ book, poems, onNavigate }: NavCardProps) {
  const router = useRouter();
  const [poemInput, setPoemInput] = useState("");
  const [variant, setVariant] = useState("");
  const [poemError, setPoemError] = useState(false);

  const variantBases = new Set(
    poems.filter((p) => p.no.includes("-A")).map((p) => p.no.replace("-A", "")),
  );
  const hasVariant = variantBases.has(poemInput.trim());

  function goToPoem() {
    const base = poemInput.trim();
    if (!base) return;
    const no = hasVariant && variant ? `${base}-${variant}` : base;
    const found = poems.find((p) => p.no === no);
    if (!found) {
      setPoemError(true);
      return;
    }
    setPoemError(false);
    setPoemInput("");
    setVariant("");
    router.push(`/manzume/${found.no}`);
    onNavigate?.();
  }

  return (
    <div className="w-full font-sans text-sm">
      <p className="mb-4 truncate font-serif text-xs text-ink-muted">{book.name}</p>

      <div>
        <label htmlFor="nav-poem" className="mb-1 block text-xs text-ink-muted">
          Manzume&apos;ye git
        </label>
        <div className="flex gap-1.5">
          <input
            id="nav-poem"
            type="text"
            inputMode="numeric"
            value={poemInput}
            onChange={(e) => {
              setPoemInput(e.target.value);
              setVariant("");
              setPoemError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && goToPoem()}
            placeholder="ör. 34"
            className={`w-full min-w-0 rounded border bg-bg px-2 py-1.5 text-ink outline-none focus:border-accent ${
              poemError ? "border-red-500" : "border-border"
            }`}
          />
          <select
            aria-label="Ek"
            disabled={!hasVariant}
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="shrink-0 rounded border border-border bg-bg px-1 py-1.5 text-ink outline-none focus:border-accent disabled:opacity-30"
          >
            <option value=""></option>
            <option value="A">A</option>
          </select>
          <button
            type="button"
            onClick={goToPoem}
            className="shrink-0 rounded border border-border px-2.5 py-1.5 text-ink-muted hover:text-accent"
          >
            Git
          </button>
        </div>
        {poemError && (
          <p className="mt-1 text-xs text-red-500">Manzume bulunamadı.</p>
        )}
      </div>
    </div>
  );
}
