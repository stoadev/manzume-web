"use client";

import { useSearchParams } from "next/navigation";
import { createContext, Suspense, useContext, useEffect, useState } from "react";
import { normalizeQuery } from "@/lib/search";

/**
 * Arama sonucundan gelen `?q=` sorgusunu sayfaya dağıtır (fosforlu kalem).
 * `useSearchParams` yalnızca küçük `QueryReader`'da, kendi Suspense sınırında
 * çalışır; böylece SSG çıktısı tam kalır ve sayfa içeriği yeniden mount olmaz.
 * `q` yokken hiçbir şey değişmez.
 */
const QueryContext = createContext<string>("");

export function useHighlightQuery(): string {
  return useContext(QueryContext);
}

function QueryReader({ onQuery }: { onQuery: (q: string) => void }) {
  const params = useSearchParams();
  const q = normalizeQuery(params.get("q") ?? "");
  useEffect(() => {
    onQuery(q);
  }, [q, onQuery]);
  return null;
}

export default function QueryHighlight({ children }: { children: React.ReactNode }) {
  const [q, setQ] = useState("");
  return (
    <QueryContext.Provider value={q}>
      <Suspense fallback={null}>
        <QueryReader onQuery={setQ} />
      </Suspense>
      {children}
    </QueryContext.Provider>
  );
}
