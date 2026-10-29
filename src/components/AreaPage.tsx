import Image from "next/image";
import Link from "next/link";
import {
  type AreaSlug,
  formatarOAB,
  linkTelefone,
  linkWhatsApp,
  mensagemPadrao,
  nomeComTratamento,
  responsavelPorArea,
  site,
} from "@/config/site";
import { type Secao, areas, areaHref, getArea } from "@/content/areas";
import { artigosPorArea } from "@/content/articles";
import { faqJsonLd } from "@/lib/seo";
import { ArticleCard } from "./ArticleCard";
import { ButtonExternal } from "./Button";
import { ContactBand } from "./ContactBand";
import { Icon } from "./icons";
import { JsonLd } from "./JsonLd";
import { delay, PageHero } from "./PageHero";
import { Pending } from "./Pending";

/** Modelo comum às páginas de área de atuação. */
export function AreaPage({ slug }: { slug: AreaSlug }) {
  const area = getArea(slug);
  const responsavel = responsavelPorArea(slug);
  const relacionados = artigosPorArea(slug);
  const outras = areas.filter((a) => a.slug !== slug);

  // Área trabalhista: os blocos por público só aparecem depois que o escritório confirmar o público atendido
  const publico = site.publicoTrabalhista;
  const blocosPublico: Secao[] = area.porPublico
    ? publico === "ambos"
      ? [area.porPublico.trabalhadores, area.porPublico.empresas].filter((s): s is Secao => Boolean(s))
      : publico
        ? [area.porPublico[publico]].filter((s): s is Secao => Boolean(s))
        : []
    : [];

  const wa = responsavel ? linkWhatsApp(responsavel, mensagemPadrao(responsavel, area.nome)) : null;

  return (
    <>
      <JsonLd data={faqJsonLd(area.perguntas)} />
      <PageHero
        eyebrow="Área de atuação"
        title={area.nome}
        crumbs={[
          { name: "Áreas de Atuação", path: "/areas-de-atuacao" },
          { name: area.nome, path: areaHref(slug) },
        ]}
        aside={
          responsavel && (
            <div className="card flex items-center gap-5 p-5">
              <div className="relative size-24 shrink-0 overflow-hidden bg-slate">
                <Image src={responsavel.foto.src} alt={responsavel.foto.alt} fill sizes="96px" className="object-cover object-top" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold">Responsável pela área</p>
                <p className="mt-1.5 font-serif text-lg leading-snug text-ivory">
                  <Link href={`/equipe#${responsavel.slug}`} className="hover:text-gold">
                    {nomeComTratamento(responsavel)}
                  </Link>
                </p>
                <p className="mt-1 text-xs text-muted">{formatarOAB(responsavel.oab)}</p>
              </div>
            </div>
          )
        }
      >
        {area.introducao.map((p) => (
          <p key={p} className="mt-4 first:mt-0">
            {p}
          </p>
        ))}
        {wa && (
          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonExternal href={wa} icon="whatsapp" aria-label={`Conversar com ${responsavel?.nomeCurto} pelo WhatsApp (abre em nova aba)`}>
              Conversar pelo WhatsApp
            </ButtonExternal>
            {responsavel && (
              <ButtonExternal href={linkTelefone(responsavel)} icon="telefone" variant="outline" newTab={false}>
                {responsavel.telefoneExibicao}
              </ButtonExternal>
            )}
          </div>
        )}
      </PageHero>

      {[...area.secoes, ...blocosPublico].map((s, si) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-titulo`} className={`scroll-mt-24 py-20 md:py-24 ${si % 2 ? "bg-coal" : "bg-ink"}`}>
          <div className="container-site">
            <div data-reveal className="max-w-2xl">
              <p className="eyebrow">{area.nomeCurto}</p>
              <h2 id={`${s.id}-titulo`} className="mt-4 text-3xl md:text-4xl">
                {s.titulo}
              </h2>
              <p className="mt-4 text-paper">{s.introducao}</p>
            </div>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {s.topicos.map((t, i) => (
                <li key={t.titulo} data-reveal style={delay(i * 80)} className="card p-7">
                  <Icon name={t.icone} className="size-7 text-gold" />
                  <h3 className="mt-5 text-xl">{t.titulo}</h3>
                  <p className="mt-2 text-[0.92rem] text-paper">{t.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {area.porPublico && !publico && (
        <div className="container-site py-6">
          <Pending label="público da área trabalhista (trabalhadores, empresas ou ambos) — defina em src/config/site.ts" />
        </div>
      )}

      <section aria-labelledby="perguntas-titulo" className="border-t border-gold/10 bg-ink py-20 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div data-reveal>
            <p className="eyebrow">Dúvidas frequentes</p>
            <h2 id="perguntas-titulo" className="mt-4 text-3xl md:text-4xl">
              Perguntas sobre {area.nome}
            </h2>
            <p className="mt-4 text-sm text-muted">Respostas gerais e informativas. Cada caso exige análise individual.</p>
          </div>
          <div className="divide-y divide-white/5 border-y border-white/5">
            {area.perguntas.map((q) => (
              <details key={q.pergunta} data-reveal className="group py-2">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 font-serif text-lg text-ivory transition-colors hover:text-gold [&::-webkit-details-marker]:hidden">
                  {q.pergunta}
                  <Icon name="setaBaixo" className="size-5 shrink-0 text-gold transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="pb-5 pr-10 text-paper">{q.resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {relacionados.length > 0 && (
        <section aria-labelledby="artigos-area" className="border-t border-gold/10 bg-coal py-20 md:py-24">
          <div className="container-site">
            <p className="eyebrow" data-reveal>
              Artigos
            </p>
            <h2 id="artigos-area" data-reveal className="mt-4 text-3xl md:text-4xl">
              Leia mais sobre {area.nomeCurto.toLowerCase()}
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {relacionados.map((a, i) => (
                <ArticleCard key={a.slug} artigo={a} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <nav aria-label="Outras áreas de atuação" className="border-t border-gold/10 bg-ink">
        <ul className="container-site grid md:grid-cols-2">
          {outras.map((o, i) => (
            <li key={o.slug} className={i === 0 ? "border-b border-white/5 md:border-b-0 md:border-r" : ""}>
              <Link href={areaHref(o.slug)} className={`group flex items-center gap-5 py-10 ${i === 0 ? "md:pr-10" : "md:pl-10"}`}>
                <Icon name={o.icone} className="size-8 shrink-0 text-gold" />
                <span className="flex-1">
                  <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">Outra área</span>
                  <span className="mt-1 block font-serif text-2xl text-ivory transition-colors group-hover:text-gold">{o.nome}</span>
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
