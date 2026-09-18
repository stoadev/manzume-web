import Link from "next/link";
import Highlighted from "@/components/Highlighted";
import type { KenzulEntry } from "@/lib/kenzul";
import { kenzulLabel } from "@/lib/routes";

interface ProseViewProps {
  entry: KenzulEntry;
  prevHref: string | null;
  nextHref: string | null;
}

const FARZ_RE = /^(\S+,?\s+[Ff]arz:)([\s\S]*)$/;

/** Giriş'te "Sekizinci farz:" ön kısmı kalın; Arapça yer tutucu ve ?q= vurgusu Highlighted'da. */
function renderParagraph(text: string, isGiris: boolean) {
  const m = isGiris ? FARZ_RE.exec(text) : null;
  if (!m) return <Highlighted text={text} scroll />;
  return (
    <>
      <span className="font-semibold">
        <Highlighted text={m[1]} scroll />
      </span>
      <Highlighted text={m[2]} scroll />
    </>
  );
}

export default function ProseView({ entry, prevHref, nextHref }: ProseViewProps) {
  const isGiris = entry.type === "giris";

  return (
    <div className="mx-auto max-w-2xl px-3 py-10 pb-36 sm:px-6 lg:pb-10">
      <article className="rounded-lg border border-border bg-bg-card px-4 py-10 shadow-sm sm:px-12 sm:py-14">
        <p className="mb-3 text-center font-sans text-xs tracking-wide text-accent uppercase">
          {kenzulLabel(entry.type, entry.no)}
        </p>
        <h1 className="mb-8 text-center font-serif text-xl text-ink sm:text-2xl">
          <Highlighted text={entry.title} scroll />
        </h1>

        <div className="mx-auto max-w-[65ch] font-serif text-[18px] leading-relaxed text-ink">
          {entry.paragraphs?.map((p, i) => (
            <p key={i} className="mb-5 last:mb-0">
              {renderParagraph(p, isGiris)}
            </p>
          ))}
          {entry.lines?.map((line, i) => (
            <p key={i} className="mb-1.5 pl-6 -indent-6 last:mb-0">
              <Highlighted text={line} scroll />
            </p>
          ))}
        </div>
      </article>

      <nav className="mt-6 flex justify-between font-sans text-sm text-ink-muted">
        {prevHref ? (
          <Link href={prevHref} className="hover:text-accent">
            ← Önceki
          </Link>
        ) : (
          <span />
        )}
        {nextHref ? (
          <Link href={nextHref} className="hover:text-accent">
            Sonraki →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
