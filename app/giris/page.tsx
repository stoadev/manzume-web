import type { Metadata } from "next";

export const metadata: Metadata = { title: "Giriş" };

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; next?: string }>;
}) {
  const { hata, next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        method="post"
        action="/api/giris"
        className="w-full max-w-sm rounded-lg border border-border bg-bg-card px-6 py-10 shadow-sm sm:px-10"
      >
        <p className="mb-1 text-center font-sans text-xs tracking-wide text-accent uppercase">
          Divân-ı Kenz-i Şümûs
        </p>
        <h1 className="mb-8 text-center font-serif text-lg text-ink">Hoş geldiniz</h1>

        <label htmlFor="sifre" className="mb-1 block font-sans text-xs text-ink-muted">
          Site şifresi
        </label>
        <input
          id="sifre"
          name="sifre"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="mb-3 w-full rounded border border-border bg-bg px-3 py-2 font-sans text-sm text-ink outline-none focus:border-accent"
        />
        {next && <input type="hidden" name="next" value={next} />}

        {hata && (
          <p className="mb-3 font-sans text-xs text-red-700">Şifre yanlış, tekrar deneyin.</p>
        )}

        <button
          type="submit"
          className="w-full rounded-full bg-accent px-4 py-2 font-sans text-sm font-medium text-bg-card transition-opacity hover:opacity-90"
        >
          Giriş
        </button>
      </form>
    </main>
  );
}
