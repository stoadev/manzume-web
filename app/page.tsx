import PoemView from "@/components/PoemView";
import ReaderShell from "@/components/ReaderShell";
import {
  getAdjacentPoems,
  getOsmanlicaInfo,
  getBook,
  getOrderedPoems,
  getPoemSummaries,
  getSections,
} from "@/lib/data";

const SLUG = "divan-i-kenz-i-sumus";

export default function Home() {
  const firstPoem = getOrderedPoems(SLUG)[0];
  const book = getBook(SLUG);
  const sections = getSections(SLUG);
  const poems = getPoemSummaries(SLUG);
  const section = sections.find((s) => s.harf === firstPoem.section) ?? null;
  const adjacent = getAdjacentPoems(SLUG, firstPoem.no);
  const osmanlica = getOsmanlicaInfo(SLUG, firstPoem.no);
  const prevHref = adjacent.prev ? `/manzume/${adjacent.prev.no}` : null;
  const nextHref = adjacent.next ? `/manzume/${adjacent.next.no}` : null;

  return (
    <ReaderShell
      book={book}
      poems={poems}
      index={adjacent.index}
      total={adjacent.total}
      prevHref={prevHref}
      nextHref={nextHref}
    >
      <PoemView
        poem={firstPoem}
        section={section}
        osmanlica={osmanlica}
        prevHref={prevHref}
        nextHref={nextHref}
      />
    </ReaderShell>
  );
}
