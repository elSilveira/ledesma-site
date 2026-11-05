import Image from "next/image";
import Link from "next/link";
import { advogadoHref, advogadosDaArea, equipe, formatarOAB, linkWhatsApp, mensagemPadrao, nomeComTratamento, responsavelPorArea } from "@/config/site";
import { areaHref, getArea } from "@/content/areas";
import { type Artigo, artigoHref, assinantes, formatarData, tempoDeLeitura } from "@/content/articles";
import { ButtonExternal, ButtonLink, buttonClasses } from "./Button";
import { EscolherAdvogado } from "./EscolherAdvogado";
import { Icon } from "./icons";
import { PageHero } from "./PageHero";
import { Pending } from "./Pending";

/**
 * Partes visuais da página de artigo, usadas pela página pública e pela pré-visualização do CMS
 * (assim a prévia mostra exatamente o que o visitante verá). Sem estado: funcionam no servidor e no navegador.
 */

export function ArtigoAbertura({ artigo }: { artigo: Artigo }) {
  const area = getArea(artigo.area);
  return (
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
  );
}

export function ArtigoCorpo({ artigo }: { artigo: Artigo }) {
  const revisores = assinantes(artigo).flatMap((s) => equipe.filter((p) => p.slug === s));
  return (
    <article className="prose-ledesma max-w-[44rem] text-[1.05rem] leading-[1.85] text-paper">
      {artigo.secoes.map((s, si) => (
        <section key={`${si}-${s.titulo}`}>
          <h2>{s.titulo}</h2>
          {s.blocos.map((b, i) =>
            b.tipo === "p" ? (
              <p key={i} className="mt-4">
                {b.texto}
              </p>
            ) : b.tipo === "lista" ? (
              <ul key={i} className="mt-4">
                {b.itens.map((it, ii) => (
                  <li key={`${ii}-${it}`}>{it}</li>
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
          {artigo.referencias.map((r, ri) => (
            <li key={`${ri}-${r}`}>{r}</li>
          ))}
        </ul>
      </section>

      <footer className="!mt-10 text-sm text-muted">
        {revisores.length > 0 ? (
          <p>
            Assinado por{" "}
            {revisores.map((p, i) => (
              <span key={p.slug}>
                {i > 0 && (i === revisores.length - 1 ? " e " : ", ")}
                <Link href={advogadoHref(p.slug)} className="text-paper underline decoration-gold/40 underline-offset-4 hover:text-gold">
                  {nomeComTratamento(p)}
                </Link>{" "}
                ({formatarOAB(p.oab)})
              </span>
            ))}
            .
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
  );
}

export function ArtigoLateral({ artigo }: { artigo: Artigo }) {
  const area = getArea(artigo.area);
  const responsavel = responsavelPorArea(artigo.area);
  // Área compartilhada: sem um responsável único, o contato abre a escolha do advogado
  const advogados = advogadosDaArea(artigo.area);
  const wa = responsavel ? linkWhatsApp(responsavel, mensagemPadrao(responsavel, area.nome)) : null;

  return (
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
      {!responsavel && advogados.length > 1 && (
        <div className="card p-7">
          <p className="eyebrow !text-[0.66rem]">Advogados da área</p>
          <ul className="mt-4 space-y-3">
            {advogados.map((p) => (
              <li key={p.slug} className="flex items-center gap-3">
                <span className="relative size-11 shrink-0 overflow-hidden bg-slate">
                  <Image src={p.foto.src} alt={p.foto.alt} fill sizes="44px" className="object-cover object-top" />
                </span>
                <Link href={advogadoHref(p.slug)} className="font-serif text-lg leading-snug text-ivory hover:text-gold">
                  {p.nomeCurto}
                </Link>
              </li>
            ))}
          </ul>
          <EscolherAdvogado area={artigo.area} className={`${buttonClasses("primary")} mt-6 w-full`}>
            <Icon name="whatsapp" className="size-4.5 shrink-0" />
            <span>WhatsApp</span>
          </EscolherAdvogado>
        </div>
      )}
    </aside>
  );
}
