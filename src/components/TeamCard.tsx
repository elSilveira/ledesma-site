import Image from "next/image";
import Link from "next/link";
import { type Integrante, formatarOAB, linkTelefone, linkWhatsApp, mensagemPadrao, nomeComTratamento } from "@/config/site";
import { areaHref, getArea } from "@/content/areas";
import { Icon } from "./icons";
import { delay } from "./PageHero";
import { Pending } from "./Pending";

/** Perfil profissional: só exibe o que foi informado; o restante fica pendente. */
export function TeamCard({ pessoa, index, detalhado = false }: { pessoa: Integrante; index: number; detalhado?: boolean }) {
  const area = getArea(pessoa.area);
  const wa = linkWhatsApp(pessoa, mensagemPadrao(pessoa, area.nome));
  return (
    <article
      id={detalhado ? pessoa.slug : undefined}
      data-reveal
      style={delay(index * 120)}
      className="card group flex scroll-mt-28 flex-col overflow-hidden"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate">
        <Image
          src={pessoa.foto.src}
          alt={pessoa.foto.alt}
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-top transition-transform duration-[1200ms] ease-out-soft group-hover:scale-[1.03]"
        />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-coal via-coal/50 to-transparent" />
        <div aria-hidden="true" className="absolute inset-3 border border-gold/25" />
      </div>
      <div className="relative -mt-14 flex flex-1 flex-col px-7 pb-8">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold">{pessoa.profissao}</p>
        <h3 className="mt-2 text-[1.55rem]">{nomeComTratamento(pessoa)}</h3>
        <p className="mt-2 text-sm text-muted">{formatarOAB(pessoa.oab)}</p>
        <div className="hairline my-6" />
        <p className="text-sm">
          <span className="text-muted">Área de atuação: </span>
          <Link href={areaHref(area.slug)} className="text-ivory underline decoration-gold/40 underline-offset-4 transition-colors hover:decoration-gold">
            {area.nome}
          </Link>
        </p>
        {detalhado && (
          <div className="mt-5 space-y-3 text-sm">
            {pessoa.minibio ? <p>{pessoa.minibio}</p> : <Pending label="minibiografia" />}
            {pessoa.formacao ? (
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold">Formação</p>
                <ul className="mt-2 space-y-1">
                  {pessoa.formacao.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden="true" className="text-gold">·</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <Pending label="formação acadêmica" />
              </div>
            )}
            {pessoa.titulos && (
              <ul className="space-y-1">
                {pessoa.titulos.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-x-6 gap-y-3 pt-7 text-sm">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gold transition-colors hover:text-ivory"
              aria-label={`Conversar com ${pessoa.nomeCurto} pelo WhatsApp (abre em nova aba)`}
            >
              <Icon name="whatsapp" className="size-5" /> WhatsApp
            </a>
          )}
          <a href={linkTelefone(pessoa)} className="inline-flex items-center gap-2 text-paper transition-colors hover:text-ivory">
            <Icon name="telefone" className="size-4.5 text-gold" /> {pessoa.telefoneExibicao}
          </a>
        </div>
      </div>
    </article>
  );
}
