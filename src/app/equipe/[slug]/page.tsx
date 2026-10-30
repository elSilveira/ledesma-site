import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AreaNews } from "@/components/AreaNews";
import { ArticleCard } from "@/components/ArticleCard";
import { ButtonExternal } from "@/components/Button";
import { ContactBand } from "@/components/ContactBand";
import { Icon } from "@/components/icons";
import { delay } from "@/components/PageHero";
import { advogadoHref, equipe, formatarOAB, linkTelefone, linkWhatsApp, mensagemPadrao, nomeComTratamento } from "@/config/site";
import { areaHref, getArea } from "@/content/areas";
import { artigosOrdenados } from "@/content/articles";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

export function generateStaticParams() {
  return equipe.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/equipe/[slug]">) {
  const { slug } = await params;
  const p = equipe.find((x) => x.slug === slug);
  if (!p) return { title: "Página não encontrada", robots: { index: false } };
  const area = getArea(p.area);
  return pageMetadata({
    title: nomeComTratamento(p),
    description: `${nomeComTratamento(p)}, ${p.profissao.toLowerCase()} da Ledesma Advocacia (${formatarOAB(p.oab)}), responsável pela área de ${area.nome}.`,
    path: advogadoHref(p.slug),
  });
}

export default async function AdvogadoPage({ params }: PageProps<"/equipe/[slug]">) {
  const { slug } = await params;
  const pessoa = equipe.find((p) => p.slug === slug);
  if (!pessoa) notFound();

  const area = getArea(pessoa.area);
  const assinados = artigosOrdenados().filter((a) => a.revisadoPor === pessoa.slug);
  const colegas = equipe.filter((p) => p.slug !== pessoa.slug);
  const wa = linkWhatsApp(pessoa, mensagemPadrao(pessoa, area.nome));
  const crumbs = [
    { name: "Início", path: "/" },
    { name: "Equipe", path: "/equipe" },
    { name: nomeComTratamento(pessoa), path: advogadoHref(pessoa.slug) },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <section className="grain relative overflow-hidden border-b border-gold/10 bg-coal pb-16 pt-32 md:pb-24 md:pt-40">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-wine/15 blur-[120px]" />
        <div className="container-site relative grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="hero-rise relative mx-auto w-full max-w-sm lg:max-w-none">
            <div aria-hidden="true" className="absolute -bottom-4 -right-4 inset-0 translate-x-4 translate-y-4 border border-gold/30" />
            <div className="relative aspect-[4/5] overflow-hidden bg-slate">
              <Image src={pessoa.foto.src} alt={pessoa.foto.alt} fill priority sizes="(min-width: 1024px) 460px, 384px" className="object-cover object-top" />
            </div>
          </div>

          <div>
            <nav aria-label="Trilha de navegação" className="mb-8">
              <ol className="flex flex-wrap items-center gap-2 text-xs text-muted">
                {crumbs.map((c, i) => (
                  <li key={c.path} className="flex items-center gap-2">
                    {i < crumbs.length - 1 ? (
                      <>
                        <Link href={c.path} className="transition-colors hover:text-gold">
                          {c.name}
                        </Link>
                        <span aria-hidden="true" className="text-gold/50">
                          /
                        </span>
                      </>
                    ) : (
                      <span aria-current="page" className="text-paper">
                        {c.name}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            <p className="eyebrow hero-rise">{pessoa.profissao}</p>
            <h1 className="hero-rise mt-5 text-4xl md:text-5xl" style={delay(120)}>
              {nomeComTratamento(pessoa)}
            </h1>
            <p className="hero-rise mt-4 text-sm text-muted" style={delay(180)}>
              {formatarOAB(pessoa.oab)}
            </p>
            <p className="hero-rise mt-6 text-sm" style={delay(220)}>
              <span className="text-muted">Área de atuação: </span>
              <Link href={areaHref(area.slug)} className="text-ivory underline decoration-gold/40 underline-offset-4 hover:decoration-gold">
                {area.nome}
              </Link>
            </p>
            {pessoa.minibio && (
              <p className="hero-rise mt-6 max-w-2xl text-[1.05rem] text-paper" style={delay(260)}>
                {pessoa.minibio}
              </p>
            )}
            {pessoa.formacao && (
              <div className="hero-rise mt-8" style={delay(300)}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold">Formação</p>
                <ul className="mt-3 space-y-1.5 text-sm text-paper">
                  {pessoa.formacao.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden="true" className="text-gold">
                        ·
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="hero-rise mt-10 flex flex-wrap gap-4" style={delay(340)}>
              {wa && (
                <ButtonExternal href={wa} icon="whatsapp" aria-label={`Conversar com ${pessoa.nomeCurto} pelo WhatsApp (abre em nova aba)`}>
                  Conversar pelo WhatsApp
                </ButtonExternal>
              )}
              <ButtonExternal href={linkTelefone(pessoa)} icon="telefone" variant="outline" newTab={false}>
                {pessoa.telefoneExibicao}
              </ButtonExternal>
            </div>
          </div>
        </div>
      </section>

      {assinados.length > 0 && (
        <section aria-labelledby="artigos-advogado" className="bg-ink py-20 md:py-24">
          <div className="container-site">
            <p className="eyebrow" data-reveal>
              Artigos
            </p>
            <h2 id="artigos-advogado" data-reveal className="mt-4 text-3xl md:text-4xl">
              Artigos {pessoa.tratamento === "Dra." ? "da" : "do"} {pessoa.nomeCurto}
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {assinados.map((a, i) => (
                <ArticleCard key={a.slug} artigo={a} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <AreaNews slug={pessoa.area} />

      <nav aria-label="Outros advogados" className="border-t border-gold/10 bg-ink">
        <ul className="container-site grid md:grid-cols-2">
          {colegas.map((c, i) => (
            <li key={c.slug} className={i === 0 ? "border-b border-white/5 md:border-b-0 md:border-r" : ""}>
              <Link href={advogadoHref(c.slug)} className={`group flex items-center gap-5 py-8 ${i === 0 ? "md:pr-10" : "md:pl-10"}`}>
                <span className="relative size-16 shrink-0 overflow-hidden bg-slate">
                  <Image src={c.foto.src} alt="" fill sizes="64px" className="object-cover object-top" />
                </span>
                <span className="flex-1">
                  <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">{getArea(c.area).nome}</span>
                  <span className="mt-1 block font-serif text-2xl text-ivory transition-colors group-hover:text-gold">{nomeComTratamento(c)}</span>
                </span>
                <Icon name="seta" className="size-5 text-gold transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ContactBand />
    </>
  );
}
