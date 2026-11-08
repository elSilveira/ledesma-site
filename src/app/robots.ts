import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { absoluteUrl } from "@/lib/seo";

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
