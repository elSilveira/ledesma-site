import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { absoluteUrl } from "@/lib/seo";

// Gerado no build (também no export estático do GitHub Pages)
export const dynamic = "force-static";

/** Enquanto o domínio definitivo não estiver configurado, o site não é indexado. */
export default function robots(): MetadataRoute.Robots {
  if (!site.indexavel) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url,
  };
}
