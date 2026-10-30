import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { ButtonExternal, ButtonLink } from "@/components/Button";
import { ContactBand } from "@/components/ContactBand";
import { Icon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { Pending } from "@/components/Pending";
import { advogadoHref, equipe, formatarOAB, linkWhatsApp, mensagemPadrao, nomeComTratamento, responsavelPorArea } from "@/config/site";
import { areaHref, getArea } from "@/content/areas";
import { artigoHref, artigos, formatarData, getArtigo, tempoDeLeitura } from "@/content/articles";
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

  const area = getArea(artigo.area);
  const responsavel = responsavelPorArea(artigo.area);
  const revisor = artigo.revisadoPor ? equipe.find((p) => p.slug === artigo.revisadoPor) : undefined;
  const relacionados = artigos.filter((a) => a.slug !== artigo.slug && a.area === artigo.area).concat(artigos.filter((a) => a.area !== artigo.area)).slice(0, 2);
  const wa = responsavel ? linkWhatsApp(responsavel, mensagemPadrao(responsavel, area.nome)) : null;

  return (
    <>
      <JsonLd data={articleJsonLd(artigo)} />
      <PageHero
        eyebrow={area.nome}
        title={artigo.titulo}
        crumbs={[
          { name: "Artigos", path: "/artigos" },
          { name: artigo.titulo, path: artigoHref(artigo.slug) },
        ]}
      >
        <p>{artigo.resumo}</p>
        <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          <span>
            Publicado em <time dateTime={artigo.publicadoEm}>{formatarData(artigo.publicadoEm)}</time>
          </span>
          {artigo.atualizadoEm !== artigo.publicadoEm && (
            <span>
              Atualizado em <time dateTime={artigo.atualizadoEm}>{formatarData(artigo.atualizadoEm)}</time>
            </span>
          )}
          <span>{tempoDeLeitura(artigo)} min de leitura</span>
        </p>
      </PageHero>

      <div className="bg-ink py-16 md:py-24">
        <div className="container-site grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <article className="prose-ledesma max-w-[44rem] text-[1.05rem] leading-[1.85] text-paper">
            {artigo.secoes.map((s) => (
              <section key={s.titulo}>
                <h2>{s.titulo}</h2>
                {s.blocos.map((b, i) =>
                  b.tipo === "p" ? (
                    <p key={i} className="mt-4">
                      {b.texto}
                    </p>
                  ) : b.tipo === "lista" ? (
                    <ul key={i} className="mt-4">
                      {b.itens.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  ) : (
                    <aside key={i} className="mt-6 flex gap-3 border-l-2 border-gold/60 bg-coal px-5 py-4 text-[0.95rem] text-paper">
                      <Icon name="alerta" className="mt-1 size-4.5 shrink-0 text-gold" />
                      {b.texto}
                    </aside>
                  ),
                )}
              </section>
            ))}

            <section aria-labelledby="referencias" className="!mt-14 border-t border-white/5 pt-8">
              <h2 id="referencias" className="!mt-0 !text-xl">
                Referências legais
              </h2>
              <ul className="mt-4 text-[0.95rem]">
                {artigo.referencias.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>

            <footer className="!mt-10 text-sm text-muted">
              {revisor ? (
                <p>
                  Assinado por{" "}
                  <Link href={advogadoHref(revisor.slug)} className="text-paper underline decoration-gold/40 underline-offset-4 hover:text-gold">
                    {nomeComTratamento(revisor)}
                  </Link>{" "}
                  ({formatarOAB(revisor.oab)}).
                </p>
              ) : (
                <>
                  <p>Conteúdo institucional da Ledesma Advocacia.</p>
                  <Pending label="revisão e assinatura do(a) advogado(a) responsável" className="mt-2" />
                </>
              )}
              <p className="mt-2">Texto informativo, elaborado com base na legislação vigente na data de publicação. Não constitui consulta jurídica.</p>
            </footer>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="card p-7">
              <p className="eyebrow !text-[0.66rem]">Área relacionada</p>
              <p className="mt-4 font-serif text-xl text-ivory">{area.nome}</p>
              <p className="mt-2 text-sm text-paper">{area.resumo}</p>
              <ButtonLink href={areaHref(area.slug)} variant="ghost" className="mt-5">
                Conhecer a área
              </ButtonLink>
            </div>
            {responsavel && (
              <div className="card p-7">
                <div className="flex items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden bg-slate">
                    <Image src={responsavel.foto.src} alt={responsavel.foto.alt} fill sizes="64px" className="object-cover object-top" />
                  </div>
                  <div>
                    <p className="font-serif text-lg leading-snug text-ivory">
                      <Link href={advogadoHref(responsavel.slug)} className="hover:text-gold">
                        {responsavel.nomeCurto}
                      </Link>
                    </p>
                    <p className="text-xs text-muted">{formatarOAB(responsavel.oab)}</p>
                  </div>
                </div>
                {wa && (
                  <ButtonExternal href={wa} icon="whatsapp" className="mt-6 w-full" aria-label={`Conversar com ${responsavel.nomeCurto} pelo WhatsApp (abre em nova aba)`}>
                    WhatsApp
                  </ButtonExternal>
                )}
              </div>
            )}
          </aside>
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
