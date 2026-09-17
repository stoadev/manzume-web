import type { Metadata } from "next";
import Link from "next/link";
import { getKenzulBook, getKenzulSummaries } from "@/lib/kenzul";
import { kenzulHref } from "@/lib/routes";

export const metadata: Metadata = {
  title: { absolute: "Kenz'il-Maarif İlmihali" },
  description:
    "Eş-Şeyh Es-Seyyid İbrahim Halil'in Kenz'il-Maarif İlmihali: giriş, 559 bahis ve 35 manzume.",
};

export default function KenzulFihrist() {
  const book = getKenzulBook();
  const summaries = getKenzulSummaries();
  const manzumeler = summaries.filter((s) => s.type === "manzume");
  const bahisler = summaries.filter((s) => s.type === "bahis");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <Link href="/" className="font-sans text-xs text-ink-muted hover:text-accent">
        ← Kütüphane
      </Link>

      <header className="mt-6 mb-10 text-center">
        <h1 className="font-serif text-2xl text-ink sm:text-3xl">{book.name}</h1>
        <p className="mt-2 font-sans text-xs text-ink-muted">{book.author}</p>
        <div className="mx-auto mt-4 h-px w-16 bg-accent" />
        <Link
          href={kenzulHref("giris", null)}
          className="mt-6 inline-block rounded-full border border-border bg-bg-card px-4 py-1.5 font-sans text-sm text-ink hover:border-accent"
        >
          Giriş ve Farzlar
        </Link>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 font-sans text-xs tracking-[0.2em] text-accent uppercase">
          Manzumeler
        </h2>
        <ol className="grid grid-cols-1 gap-x-6 gap-y-1.5 font-serif text-sm sm:grid-cols-2">
          {manzumeler.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="text-ink hover:text-accent">
                {s.no}. {s.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-4 font-sans text-xs tracking-[0.2em] text-accent uppercase">
          Bahisler
        </h2>
        <ol className="grid grid-cols-1 gap-x-6 gap-y-1.5 font-serif text-sm sm:grid-cols-2">
          {bahisler.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="text-ink hover:text-accent">
                {s.no}. {s.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
