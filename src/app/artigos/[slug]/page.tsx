import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { ArtigoAbertura, ArtigoCorpo, ArtigoLateral } from "@/components/ArtigoVisual";
import { ContactBand } from "@/components/ContactBand";
import { JsonLd } from "@/components/JsonLd";
import { artigoHref, artigos, getArtigo } from "@/content/articles";
import { articleJsonLd, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return artigos.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/artigos/[slug]">) {
  const { slug } = await params;
  const a = getArtigo(slug);
  if (!a) return { title: "Artigo não encontrado", robots: { index: false } };
  return pageMetadata({
    title: a.titulo,
    description: a.descricao,
    path: artigoHref(a.slug),
    type: "article",
    publishedTime: a.publicadoEm,
    modifiedTime: a.atualizadoEm,
    keywords: a.palavrasChave,
  });
}

export default async function ArtigoPage({ params }: PageProps<"/artigos/[slug]">) {
  const { slug } = await params;
  const artigo = getArtigo(slug);
  if (!artigo) notFound();

  const relacionados = artigos.filter((a) => a.slug !== artigo.slug && a.area === artigo.area).concat(artigos.filter((a) => a.area !== artigo.area)).slice(0, 2);

  return (
    <>
      <JsonLd data={articleJsonLd(artigo)} />
      <ArtigoAbertura artigo={artigo} />

      <div className="bg-ink py-16 md:py-24">
        <div className="container-site grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <ArtigoCorpo artigo={artigo} />
          <ArtigoLateral artigo={artigo} />
        </div>
      </div>

      {relacionados.length > 0 && (
        <section aria-labelledby="relacionados" className="border-t border-gold/10 bg-coal py-20">
          <div className="container-site">
            <h2 id="relacionados" className="text-3xl">
              Continue lendo
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {relacionados.map((a, i) => (
                <ArticleCard key={a.slug} artigo={a} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <ContactBand />
    </>
  );
}
