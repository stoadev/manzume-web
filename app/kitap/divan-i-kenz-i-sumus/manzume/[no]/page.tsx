import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PoemView from "@/components/PoemView";
import ReaderShell from "@/components/ReaderShell";
import {
  getAdjacentPoems,
  getOsmanlicaInfo,
  getBook,
  getPoem,
  getPoems,
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

export function generateStaticParams() {
  return getPoems(SLUG).map((poem) => ({ no: poem.no }));
}

export default async function ManzumePage({
  params,
}: {
  params: Promise<{ no: string }>;
}) {
  const { no } = await params;
  const poem = getPoem(SLUG, no);

  if (!poem) {
    notFound();
  }

  const book = getBook(SLUG);
  const sections = getSections(SLUG);
  const poems = getPoemSummaries(SLUG);
  const section = sections.find((s) => s.harf === poem.section) ?? null;
  const adjacent = getAdjacentPoems(SLUG, no);
  const osmanlica = getOsmanlicaInfo(SLUG, no);
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
        poem={poem}
        section={section}
        osmanlica={osmanlica}
        prevHref={prevHref}
        nextHref={nextHref}
      />
    </ReaderShell>
  );
}
