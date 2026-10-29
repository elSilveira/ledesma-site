import type { MetadataRoute } from "next";
import { areas, areaHref } from "@/content/areas";
import { artigoHref, artigos } from "@/content/articles";
import { fontesNoticias, noticiasHref } from "@/config/noticias";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const paginas: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/o-escritorio"), changeFrequency: "yearly", priority: 0.7 },
    { url: absoluteUrl("/equipe"), changeFrequency: "yearly", priority: 0.7 },
    { url: absoluteUrl("/areas-de-atuacao"), changeFrequency: "yearly", priority: 0.8 },
    ...areas.map((a) => ({ url: absoluteUrl(areaHref(a.slug)), changeFrequency: "yearly" as const, priority: 0.9 })),
    { url: absoluteUrl("/artigos"), changeFrequency: "weekly", priority: 0.7 },
    ...artigos.map((a) => ({ url: absoluteUrl(artigoHref(a.slug)), lastModified: a.atualizadoEm, changeFrequency: "yearly" as const, priority: 0.6 })),
    { url: absoluteUrl(noticiasHref()), changeFrequency: "hourly", priority: 0.6 },
    ...fontesNoticias.map((f) => ({ url: absoluteUrl(noticiasHref(f.id)), changeFrequency: "hourly" as const, priority: 0.5 })),
    { url: absoluteUrl("/contato"), changeFrequency: "yearly", priority: 0.8 },
    { url: absoluteUrl("/politica-de-privacidade"), changeFrequency: "yearly", priority: 0.2 },
  ];
  return paginas;
}
