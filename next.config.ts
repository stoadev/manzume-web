import type { NextConfig } from "next";

// Giriş kontrolü (proxy.ts) sunucu gerektirdiğinden statik export kapalı;
// sayfalar yine build'de statik üretilir (SSG), Vercel'de ek maliyet yok.
const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Eski manzume adresleri (paylaşılan linkler, WhatsApp botu) yeni kitap yoluna.
      {
        source: "/manzume/:no",
        destination: "/kitap/divan-i-kenz-i-sumus/manzume/:no",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
