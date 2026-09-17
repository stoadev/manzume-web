import type { Metadata } from "next";
import KenzulReader from "@/components/KenzulReader";
import { getKenzulEntries } from "@/lib/kenzul";

type Params = Promise<{ no: string }>;

export function generateStaticParams() {
  return getKenzulEntries()
    .filter((e) => e.type === "bahis")
    .map((e) => ({ no: String(e.no) }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { no } = await params;
  return { title: `Bahis ${no} — Kenz'il-Maarif İlmihali` };
}

export default async function KenzulBahisPage({ params }: { params: Params }) {
  const { no } = await params;
  const n = /^\d+$/.test(no) ? parseInt(no, 10) : NaN;
  return <KenzulReader type="bahis" no={Number.isNaN(n) ? -1 : n} />;
}
