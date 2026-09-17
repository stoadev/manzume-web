import Link from "next/link";
import { BOOKS } from "@/lib/books";
import { bookHref } from "@/lib/routes";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <header className="mb-10 text-center">
        <p className="font-sans text-xs tracking-[0.3em] text-ink-muted uppercase">
          Manzumeler
        </p>
        <div className="mx-auto mt-4 h-px w-16 bg-accent" />
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {BOOKS.map((book) => {
          const cardClass =
            "flex h-full flex-col rounded-lg border border-border bg-bg-card px-5 py-6 shadow-sm";
          const body = (
            <>
              <h2 className="font-serif text-lg text-ink">{book.name}</h2>
              <p className="mt-1 font-sans text-xs text-ink-muted">{book.author}</p>
              <p className="mt-4 font-serif text-sm text-ink-muted">{book.blurb}</p>
              {!book.available && (
                <span className="mt-4 inline-block self-start rounded-full border border-border px-2 py-0.5 font-sans text-[11px] text-ink-muted">
                  yakında
                </span>
              )}
            </>
          );

          return (
            <li key={book.slug}>
              {book.available ? (
                <Link
                  href={bookHref(book.slug)}
                  className={`${cardClass} transition-colors hover:border-accent`}
                >
                  {body}
                </Link>
              ) : (
                <div aria-disabled="true" className={`${cardClass} opacity-70`}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
