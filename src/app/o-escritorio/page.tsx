import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { ContactBand } from "@/components/ContactBand";
import { Icon } from "@/components/icons";
import { delay, PageHero } from "@/components/PageHero";
import { Pending } from "@/components/Pending";
import { SectionHeading } from "@/components/SectionHeading";
import { enderecoLinha, fotoEquipe, linkMapa, sedes, site } from "@/config/site";
import { areas, areaHref } from "@/content/areas";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "O Escritório",
  description:
    "Conheça a Ledesma Advocacia S/S: sedes em Toledo (PR) e Iguatemi (MS), atuação em Direito Criminal e Penal, Trabalhista e Previdenciário, e atendimento também a distância.",
  path: "/o-escritorio",
});

export default function EscritorioPage() {
  return (
    <>
      <PageHero eyebrow="O escritório" title="Ledesma Advocacia" crumbs={[{ name: "O Escritório", path: "/o-escritorio" }]}>
        <p>
          Sociedade de advogados com sedes em Toledo (PR) e Iguatemi (MS), dedicada às áreas criminal, trabalhista e previdenciária.
        </p>
      </PageHero>

      <section aria-labelledby="quem-somos" className="bg-ink py-24 md:py-32">
        <div className="container-site grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading id="quem-somos" eyebrow="Quem somos" title="Uma equipe, três áreas de atuação">
              <p>
                A {site.razaoSocial} reúne advogados com atuação em Direito Criminal e Penal, Direito Trabalhista e Direito Previdenciário. Cada área tem um
                profissional responsável, o que permite acompanhamento direto e comunicação objetiva com quem procura o escritório.
              </p>
              <p className="mt-4">
                Além do atendimento presencial nas duas sedes, o escritório também atende a distância, por meios digitais.
              </p>
              {site.anosDeAtuacao ? (
                <p className="mt-4">Atuação há mais de {site.anosDeAtuacao} anos.</p>
              ) : (
                <div className="mt-4">
                  <Pending label="tempo de atuação do escritório (confirmar)" />
                </div>
              )}
            </SectionHeading>
          </div>
          <figure data-reveal className="relative">
            <div aria-hidden="true" className="absolute -inset-3 -translate-x-5 translate-y-5 border border-gold/25" />
            <Image
              src={fotoEquipe.src}
              alt={fotoEquipe.alt}
              width={fotoEquipe.width}
              height={fotoEquipe.height}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="relative h-auto w-full"
            />
          </figure>
        </div>
      </section>

      <section aria-labelledby="valores" className="border-y border-gold/10 bg-coal py-24">
        <div className="container-site">
          <SectionHeading id="valores" eyebrow="Valores" title="O que orienta o trabalho" align="center" />
          <ul className="mt-14 grid gap-5 md:grid-cols-3">
            {site.valores.map((v, i) => (
              <li key={v} data-reveal style={delay(i * 110)} className="card p-10 text-center">
                <span aria-hidden="true" className="font-serif text-5xl italic text-gold/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-2xl">{v}</h3>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="sedes" className="bg-ink py-24 md:py-32">
        <div className="container-site">
          <SectionHeading id="sedes" eyebrow="Sedes" title="Onde estamos" />
          <ul className="mt-14 grid gap-5 md:grid-cols-2">
            {sedes.map((s, i) => (
              <li key={s.slug} id={s.slug} data-reveal style={delay(i * 120)} className="card scroll-mt-28 p-8 md:p-10">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-3xl">
                    {s.cidade} <span className="text-gold">–</span> {s.uf}
                  </h3>
                  <Icon name="local" className="size-8 text-gold" />
                </div>
                <p className="mt-5 text-paper">{enderecoLinha(s)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.cep ? <p className="text-sm text-muted">CEP {s.cep}</p> : <Pending label="CEP" />}
                  {s.horario ? <p className="text-sm text-muted">{s.horario}</p> : <Pending label="horário de atendimento" />}
                </div>
                <a
                  href={linkMapa(s)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-gold hover:text-ivory"
                >
                  Abrir no Google Maps <Icon name="externo" className="size-3.5" />
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="areas-escritorio" className="border-t border-gold/10 bg-coal py-24">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <SectionHeading id="areas-escritorio" eyebrow="Áreas de atuação" title="Conheça cada área" />
          <ul className="divide-y divide-white/5 border-y border-white/5">
            {areas.map((a) => (
              <li key={a.slug} data-reveal>
                <Link href={areaHref(a.slug)} className="group flex items-center gap-6 py-6">
                  <Icon name={a.icone} className="size-7 shrink-0 text-gold" />
                  <span className="flex-1">
                    <span className="block font-serif text-xl text-ivory">{a.nome}</span>
                    <span className="mt-1 block text-sm text-muted">{a.resumo}</span>
                  </span>
                  <Icon name="seta" className="size-5 shrink-0 text-gold transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="container-site mt-12">
          <ButtonLink href="/equipe" variant="outline">
            Conheça a equipe
          </ButtonLink>
        </div>
      </section>

      <ContactBand />
    </>
  );
}
