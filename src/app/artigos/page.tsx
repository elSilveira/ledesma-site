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
          <nav aria-label="Artigos por área" className="flex flex-wrap gap-3">
            {areas.map((a) => (
              <a
                key={a.slug}
                href={`#artigos-${a.slug}`}
                className="inline-flex items-center gap-2 border border-gold/25 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:border-gold hover:text-ivory"
              >
                <Icon name={a.icone} className="size-4 text-gold" /> {a.nomeCurto}
              </a>
            ))}
          </nav>

          {areas.map((area) => {
            const daArea = lista.filter((a) => a.area === area.slug);
            if (daArea.length === 0) return null;
            return (
              <section key={area.slug} id={`artigos-${area.slug}`} aria-labelledby={`titulo-${area.slug}`} className="mt-16 scroll-mt-28 border-t border-white/5 pt-12 first-of-type:mt-12">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <h2 id={`titulo-${area.slug}`} className="flex items-center gap-3 text-3xl md:text-4xl">
                    <Icon name={area.icone} className="size-7 text-gold" /> {area.nome}
                  </h2>
                  <Link href={areaHref(area.slug)} className="group inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-gold hover:text-ivory">
                    Conheça a área
                    <Icon name="seta" className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {daArea.map((a, i) => (
                    <ArticleCard key={a.slug} artigo={a} index={i} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <ContactBand />
    </>
  );
}
