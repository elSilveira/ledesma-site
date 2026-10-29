import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { ContactBand } from "@/components/ContactBand";
import { Icon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";
import { areas, areaHref } from "@/content/areas";
import { artigosOrdenados } from "@/content/articles";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Artigos",
  description:
    "Artigos informativos da Ledesma Advocacia sobre Direito Criminal e Penal, Direito Trabalhista e Direito Previdenciário: direitos, prazos e procedimentos.",
  path: "/artigos",
});

export default function ArtigosPage() {
  const lista = artigosOrdenados();
  return (
    <>
      <PageHero eyebrow="Artigos" title="Conteúdo jurídico" crumbs={[{ name: "Artigos", path: "/artigos" }]}>
        <p>Textos informativos sobre direitos e procedimentos. Eles não substituem a análise individual de cada caso.</p>
      </PageHero>

      <section aria-label="Lista de artigos" className="bg-ink py-20 md:py-24">
        <div className="container-site">
          <nav aria-label="Artigos por área" className="mb-12 flex flex-wrap gap-3">
            {areas.map((a) => (
              <Link
                key={a.slug}
                href={`${areaHref(a.slug)}#artigos-area`}
                className="inline-flex items-center gap-2 border border-gold/25 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:border-gold hover:text-ivory"
              >
                <Icon name={a.icone} className="size-4 text-gold" /> {a.nomeCurto}
              </Link>
            ))}
          </nav>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {lista.map((a, i) => (
              <ArticleCard key={a.slug} artigo={a} index={i % 3} headingLevel="h2" />
            ))}
          </div>
        </div>
      </section>

      <ContactBand />
    </>
  );
}
