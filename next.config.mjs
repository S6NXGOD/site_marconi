/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Não expõe a versão do Next para quem escaneia o site.
  poweredByHeader: false,

  // Falhar o build em erro de tipo/lint é proposital: melhor quebrar o deploy
  // do que subir o site com erro silencioso.
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  images: {
    // As imagens do site vêm de public/ e do volume (/api/uploads/...).
    // NÃO usar hostname wildcard: isso transformaria /_next/image num proxy
    // aberto, permitindo que terceiros sirvam imagens às custas da nossa banda.
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // O painel nunca deve ser indexado nem cacheado.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
