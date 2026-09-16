import type { NextConfig } from "next";

// Giriş kontrolü (proxy.ts) sunucu gerektirdiğinden statik export kapalı;
// sayfalar yine build'de statik üretilir (SSG), Vercel'de ek maliyet yok.
const nextConfig: NextConfig = {};

export default nextConfig;
