import PoemLeaves from "@/components/PoemLeaves";
import type { Poem, Section } from "@/lib/data";

interface PoemViewProps {
  poem: Poem;
  section: Section | null;
  prevHref: string | null;
  nextHref: string | null;
}

export default function PoemView({
  poem,
  section,
  prevHref,
  nextHref,
}: PoemViewProps) {
  return (
    <div className="mx-auto max-w-2xl px-3 py-10 pb-36 sm:px-6 lg:pb-10">
      <div className="rounded-lg border border-border bg-bg-card px-4 py-10 shadow-sm sm:px-12 sm:py-14">
        <div className="mb-6 font-sans text-xs text-ink-muted">
          <span className="tracking-wide text-accent uppercase">
            {section?.name}
          </span>
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
    </div>
  );
}
