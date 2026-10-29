import type { NextConfig } from "next";

/** Build estático para o GitHub Pages (ver .github/workflows/pages.yml). */
const exportEstatico = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Export estático não suporta Cache Components (PPR); lá basta o `use cache` das notícias
  cacheComponents: !exportEstatico,
  partialPrefetching: !exportEstatico,
  ...(exportEstatico && { experimental: { useCache: true } }),
  ...(exportEstatico && { output: "export", trailingSlash: true, basePath }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: exportEstatico
    ? { loader: "custom", loaderFile: "./src/lib/image-loader.ts" }
    : { formats: ["image/avif", "image/webp"], qualities: [75] },
  // Cabeçalhos não se aplicam a export estático; no GitHub Pages ficam a cargo da hospedagem.
  ...(!exportEstatico && {
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
