import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "latin-ext"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: { default: "Manzumeler", template: "%s — Manzumeler" },
  description:
    "Eş-Şeyh Es-Seyyid İbrahim Halil'in eserleri: Divân-ı Kenz-i Şümûs manzumeleri ve Kenz'il-Maarif İlmihali.",
  // Site listelenmez: yalnızca linki bilenler girer (bkz. app/robots.ts, vercel.json).
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${lora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
