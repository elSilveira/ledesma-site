import { getFonte } from "@/config/noticias";
import { areas } from "@/content/areas";
import { formatarDataNoticia, type Noticia } from "@/lib/noticias-shared";
import { Icon } from "./icons";

/** Cartão de notícia externa: manchete, resumo curto e link para a matéria original. */
export function NewsCard({ noticia, headingLevel = "h3", compacto = false }: { noticia: Noticia; headingLevel?: "h2" | "h3"; compacto?: boolean }) {
  const fonte = getFonte(noticia.fonte);
  const H = headingLevel;
  const areasItem = areas.filter((a) => noticia.areas.includes(a.slug));
  return (
    <article className="card card-interactive group flex h-full flex-col p-7">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
        <span className="text-gold">{fonte?.nome}</span>
        <span aria-hidden="true" className="text-gold/40">
          ·
        </span>
        <span className="text-muted">{fonte?.rotuloTipo}</span>
      </p>
      <H className={`mt-4 leading-snug ${compacto ? "text-[1.15rem]" : "text-[1.25rem]"}`}>
        <a href={noticia.link} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0 hover:text-gold">
          {noticia.titulo}
          <span className="sr-only"> (abre o site {fonte?.nome} em nova aba)</span>
        </a>
      </H>
      {noticia.resumo && !compacto && <p className="mt-3 text-[0.9rem] text-paper">{noticia.resumo}</p>}
      <div className="mt-auto pt-6">
        {(areasItem.length > 0 || noticia.regional) && (
          <ul className="mb-4 flex flex-wrap gap-1.5" aria-label="Classificação">
            {areasItem.map((a) => (
              <li key={a.slug} className="inline-flex items-center gap-1.5 border border-gold/20 px-2 py-0.5 text-[0.68rem] text-paper">
                <Icon name={a.icone} className="size-3.5 text-gold" />
                {a.nomeCurto}
              </li>
            ))}
            {noticia.regional && <li className="border border-wine-text/30 px-2 py-0.5 text-[0.68rem] text-wine-text">PR / MS</li>}
          </ul>
        )}
        <div className="flex items-center justify-between gap-4 text-xs text-muted">
          {noticia.data ? <time dateTime={noticia.data}>{formatarDataNoticia(noticia.data)}</time> : <span />}
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-gold/80 transition-colors group-hover:text-gold">
            Ler na fonte <Icon name="externo" className="size-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
