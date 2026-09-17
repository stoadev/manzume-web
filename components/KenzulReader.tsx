import { notFound } from "next/navigation";
import KenzulNav from "@/components/KenzulNav";
import ProseView from "@/components/ProseView";
import ReaderShell from "@/components/ReaderShell";
import {
  KENZUL_SLUG,
  getKenzulAdjacent,
  getKenzulBook,
  getKenzulEntry,
  getKenzulSummaries,
} from "@/lib/kenzul";
import type { KenzulType } from "@/lib/routes";

/** Üç Kenz'il-Maarif okuma sayfasının ortak gövdesi (sunucu bileşeni). */
export default function KenzulReader({ type, no }: { type: KenzulType; no: number | null }) {
  const entry = getKenzulEntry(type, no);
  if (!entry) notFound();

  const book = getKenzulBook();
  const summaries = getKenzulSummaries();
  const adjacent = getKenzulAdjacent(type, no);
  const prevHref = adjacent.prev?.href ?? null;
  const nextHref = adjacent.next?.href ?? null;

  return (
    <ReaderShell
      slug={KENZUL_SLUG}
      book={book}
      index={adjacent.index}
      total={adjacent.total}
      prevHref={prevHref}
      nextHref={nextHref}
      positionLabel={`${adjacent.index + 1} / ${adjacent.total}`}
      findLabel="Fihrist"
      nav={<KenzulNav bookName={book.name} summaries={summaries} />}
    >
      <ProseView entry={entry} prevHref={prevHref} nextHref={nextHref} />
    </ReaderShell>
  );
}
