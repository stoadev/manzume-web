import type { Metadata } from "next";
import KenzulReader from "@/components/KenzulReader";

export const metadata: Metadata = { title: "Giriş — Kenz'il-Maarif İlmihali" };

export default function KenzulGirisPage() {
  return <KenzulReader type="giris" no={null} />;
}
