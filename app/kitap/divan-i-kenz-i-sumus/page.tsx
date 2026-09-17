import type { Metadata } from "next";
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
import { poemHref } from "@/lib/routes";

const SLUG = "divan-i-kenz-i-sumus";

export const metadata: Metadata = {
  title: { absolute: "Divân-ı Kenz-i Şümûs" },
  description:
    "Eş-Şeyh Es-Seyyid İbrahim Halil'in Divân-ı Kenz-i Şümûs eserinden manzumeler.",
};

export default function KenzSumusHome() {
  const firstPoem = getOrderedPoems(SLUG)[0];
  const book = getBook(SLUG);
  const sections = getSections(SLUG);
  const poems = getPoemSummaries(SLUG);
  const section = sections.find((s) => s.harf === firstPoem.section) ?? null;
  const adjacent = getAdjacentPoems(SLUG, firstPoem.no);
  const osmanlica = getOsmanlicaInfo(SLUG, firstPoem.no);
  const prevHref = adjacent.prev ? poemHref(SLUG, adjacent.prev.no) : null;
  const nextHref = adjacent.next ? poemHref(SLUG, adjacent.next.no) : null;

  return (
    <ReaderShell
      slug={SLUG}
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
