import Image from "next/image";
import Link from "next/link";
import { AreaCard } from "@/components/AreaCard";
import { ArticleCard } from "@/components/ArticleCard";
import { ButtonLink } from "@/components/Button";
import { ContactBand } from "@/components/ContactBand";
import { HomeNews } from "@/components/HomeNews";
import { Icon, type IconName } from "@/components/icons";
import { delay } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { TeamCard } from "@/components/TeamCard";
import { enderecoLinha, equipe, fotoEquipe, linkMapa, sedes } from "@/config/site";
import { areas } from "@/content/areas";
import { artigosOrdenados } from "@/content/articles";
import { pageMetadata } from "@/lib/seo";

const homeTitle = "Ledesma Advocacia | Advogados em Toledo – PR";

export const metadata = {
  ...pageMetadata({
  title: homeTitle,
  description:
    "Escritório de advocacia em Toledo (PR) e Iguatemi (MS). Atuação em Direito Criminal e Penal, Direito Trabalhista e Direito Previdenciário, com atendimento presencial e a distância.",
  path: "/",
  }),
  title: { absolute: homeTitle },
};

const principios: { icone: IconName; titulo: string; texto: string }[] = [
  { icone: "escudo", titulo: "Sigilo profissional", texto: "Dever previsto no Estatuto da Advocacia e no Código de Ética da OAB." },
  { icone: "documento", titulo: "Comunicação clara", texto: "Explicação dos caminhos possíveis, dos prazos e dos riscos de cada etapa." },
  { icone: "pessoas", titulo: "Atendimento próximo", texto: "Presencial nas sedes de Toledo e Iguatemi, e também a distância." },
  { icone: "balanca", titulo: "Ética", texto: "Atuação pautada pela ética, pela transparência e pela eficiência." },
];

// Ordem das pessoas na fotografia da equipe, da esquerda para a direita
const ordemNaFoto = ["gustavo", "erminio", "amanda"].map((slug) => equipe.find((p) => p.slug === slug)!);

export default function Home() {
  const recentes = artigosOrdenados().slice(0, 3);
  return (
    <>
      {/* Abertura */}
      <section className="grain relative isolate overflow-hidden bg-ink pt-28 lg:min-h-[100svh] lg:pt-20">
        <div aria-hidden="true" className="pointer-events-none absolute -left-48 top-1/3 -z-10 size-[40rem] rounded-full bg-wine/20 blur-[140px]" />
        <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 -z-10 h-full w-1/2 bg-[radial-gradient(ellipse_at_top_right,rgb(196_166_110/0.08),transparent_60%)]" />
        <div className="container-site grid items-center gap-14 pb-20 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1fr_1.08fr] lg:pb-12">
          <div className="pt-10 lg:pt-0">
            <p className="eyebrow hero-rise">Toledo – PR · Iguatemi – MS</p>
            <h1 className="hero-rise mt-7 text-[2.6rem] leading-[1.08] sm:text-6xl lg:text-[4.4rem]" style={delay(120)}>
              Orientação jurídica com ética, técnica e <em className="font-serif italic text-gold">proximidade.</em>
            </h1>
            <p className="hero-rise mt-7 max-w-xl text-lg text-paper" style={delay(240)}>
              Atuação em Direito Criminal e Penal, Direito Trabalhista e Direito Previdenciário, com atendimento presencial nas sedes e também a distância.
            </p>
            <div className="hero-rise mt-10 flex flex-wrap gap-4" style={delay(360)}>
              <ButtonLink href="/contato">Fale com o escritório</ButtonLink>
              <ButtonLink href="/areas-de-atuacao" variant="outline">
                Áreas de atuação
              </ButtonLink>
            </div>
          </div>

          <figure className="hero-rise relative" style={delay(300)}>
            <div aria-hidden="true" className="absolute -inset-3 translate-x-5 translate-y-5 border border-gold/30 md:-inset-4 md:translate-x-7 md:translate-y-7" />
            <div className="relative overflow-hidden bg-slate">
              <Image
                src={fotoEquipe.src}
                alt={fotoEquipe.alt}
                width={fotoEquipe.width}
                height={fotoEquipe.height}
                sizes="(min-width: 1024px) 50vw, 100vw"
                preload
                className="h-auto w-full"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
              <div aria-hidden="true" className="absolute inset-0 shadow-[inset_0_0_120px_rgb(0_0_0/0.55)]" />
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-2 px-4 pb-5 text-center md:px-8">
              {ordemNaFoto.map((p) => (
                <Link key={p.slug} href={`/equipe#${p.slug}`} className="group">
                  <span className="block font-serif text-sm text-ivory transition-colors group-hover:text-gold md:text-lg">{p.nomeCurto}</span>
                  <span className="block text-[0.6rem] uppercase tracking-[0.16em] text-gold md:text-[0.65rem]">
                    {areas.find((a) => a.slug === p.area)?.nomeCurto}
                  </span>
                </Link>
              ))}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Áreas */}
      <section aria-labelledby="areas-titulo" className="relative border-t border-gold/10 bg-coal py-24 md:py-32">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHeading id="areas-titulo" eyebrow="Áreas de atuação" title="Atuação técnica em três áreas do Direito">
              <p>Cada área é conduzida por um(a) advogado(a) da equipe, com acompanhamento direto do início ao fim.</p>
            </SectionHeading>
            <ButtonLink href="/areas-de-atuacao" variant="ghost" data-reveal>
              Ver todas as áreas
            </ButtonLink>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {areas.map((a, i) => (
              <AreaCard key={a.slug} area={a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Princípios */}
      <section aria-label="Como trabalhamos" className="border-y border-gold/10 bg-ink">
        <ul className="container-site grid divide-y divide-white/5 md:grid-cols-4 md:divide-x md:divide-y-0">
          {principios.map((p, i) => (
            <li key={p.titulo} data-reveal style={delay(i * 90)} className="flex gap-5 py-10 md:flex-col md:px-7 md:first:pl-0 md:last:pr-0">
              <Icon name={p.icone} className="size-8 shrink-0 text-gold" />
              <div>
                <h3 className="font-sans text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ivory">{p.titulo}</h3>
                <p className="mt-2 text-sm text-muted">{p.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Equipe */}
      <section aria-labelledby="equipe-titulo" className="bg-coal py-24 md:py-32">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHeading id="equipe-titulo" eyebrow="Nossa equipe" title="Os advogados do escritório" />
            <ButtonLink href="/equipe" variant="ghost" data-reveal>
              Conheça a equipe
            </ButtonLink>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {equipe.map((p, i) => (
              <TeamCard key={p.slug} pessoa={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Escritório */}
      <section aria-labelledby="escritorio-titulo" className="relative overflow-hidden border-t border-gold/10 bg-ink py-24 md:py-32">
        <Image
          src="/brand/emblema.png"
          alt=""
          width={420}
          height={419}
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/2 hidden w-[34rem] -translate-y-1/2 opacity-[0.035] lg:block"
        />
        <div className="container-site relative grid gap-14 lg:grid-cols-2 lg:items-center">
          <SectionHeading id="escritorio-titulo" eyebrow="O escritório" title="Duas sedes, uma mesma forma de trabalhar">
            <p>
              A Ledesma Advocacia S/S atua nas áreas criminal, trabalhista e previdenciária, com sedes em Toledo, no Paraná, e em Iguatemi, no Mato Grosso do
              Sul, e atendimento também a distância.
            </p>
            <div className="mt-8">
              <ButtonLink href="/o-escritorio" variant="outline">
                Conheça o escritório
              </ButtonLink>
            </div>
          </SectionHeading>
          <ul className="grid gap-5 sm:grid-cols-2">
            {sedes.map((s, i) => (
              <li key={s.slug} data-reveal style={delay(i * 120)} className="card p-8">
                <Icon name="local" className="size-7 text-gold" />
                <h3 className="mt-6 text-2xl">
                  {s.cidade} <span className="text-gold">–</span> {s.uf}
                </h3>
                <p className="mt-3 text-sm text-paper">
                  {s.logradouro}, {s.numero}
                  <br />
                  {s.bairro}
                </p>
                <a
                  href={linkMapa(s)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ver ${enderecoLinha(s)} no Google Maps (abre em nova aba)`}
                  className="mt-6 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold hover:text-ivory"
                >
                  Ver no mapa <Icon name="externo" className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Notícias */}
      <HomeNews />

      {/* Artigos */}
      <section aria-labelledby="artigos-titulo" className="border-t border-gold/10 bg-coal py-24 md:py-32">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHeading id="artigos-titulo" eyebrow="Artigos" title="Conteúdo jurídico para informar">
              <p>Textos objetivos sobre direitos e procedimentos nas áreas em que o escritório atua.</p>
            </SectionHeading>
            <ButtonLink href="/artigos" variant="ghost" data-reveal>
              Todos os artigos
            </ButtonLink>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {recentes.map((a, i) => (
              <ArticleCard key={a.slug} artigo={a} index={i} />
            ))}
          </div>
        </div>
      </section>

      <ContactBand />
    </>
  );
}
