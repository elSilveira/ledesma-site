import { type FonteNoticias, fontesNoticias, noticiasHref, tiposFonte } from "@/config/noticias";
import { getNoticias } from "@/lib/noticias";
import { formatarDataNoticia } from "@/lib/noticias-shared";
import { Icon } from "./icons";
import { NewsExplorer } from "./NewsExplorer";
import { PageHero } from "./PageHero";

/** Corpo comum de /noticias e /noticias/<categoria>. */
export async function NoticiasView({ fonte }: { fonte?: FonteNoticias }) {
  const { itens, fontes, atualizadoEm } = await getNoticias();
  const lista = fonte ? itens.filter((n) => n.fonte === fonte.id) : itens;
  const status = (id: string) => fontes.find((f) => f.fonte === id);
  const indisponiveis = fontesNoticias.filter((f) => !status(f.id)?.ok);

  const crumbs = [{ name: "Notícias", path: noticiasHref() }, ...(fonte ? [{ name: fonte.nome, path: noticiasHref(fonte.id) }] : [])];

  return (
    <>
      <PageHero eyebrow={fonte ? tiposFonte[fonte.tipo].nome : "Notícias jurídicas"} title={fonte ? fonte.nome : "Notícias"} crumbs={crumbs}>
        <p>
          {fonte
            ? fonte.descricao
            : "Acompanhe as publicações recentes dos tribunais e da imprensa jurídica, organizadas por fonte e classificadas pelas áreas de atuação do escritório."}
        </p>
        {fonte && (
          <p className="mt-4 text-sm text-muted">
            Local de referência: <span className="text-paper">{fonte.local}</span>
          </p>
        )}
      </PageHero>

      <section aria-label="Lista de notícias" className="bg-ink py-16 md:py-20">
        <div className="container-site">
          <div className="min-w-0">
            <p className="mb-6 text-xs text-muted">
              Atualizado em <time dateTime={atualizadoEm}>{formatarDataNoticia(atualizadoEm)}</time>. As fontes são consultadas a cada 30 minutos.
            </p>
            {fonte && !status(fonte.id)?.ok ? (
              <div className="card p-10">
                <Icon name="alerta" className="size-7 text-gold" />
                <h2 className="mt-5 text-2xl">Fonte temporariamente indisponível</h2>
                <p className="mt-3 max-w-xl text-paper">
                  Não foi possível ler o canal de notícias de {fonte.nome} na última atualização. O conteúdo pode ser consultado diretamente no site da fonte.
                </p>
                <a
                  href={fonte.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-gold hover:text-ivory"
                >
                  Acessar {fonte.nome} <Icon name="externo" className="size-3.5" />
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </div>
            ) : (
              <NewsExplorer itens={lista} />
            )}

            {!fonte && indisponiveis.length > 0 && (
              <p className="mt-10 text-xs text-muted">
                Indisponível na última atualização: {indisponiveis.map((f) => f.nome).join(", ")}.
              </p>
            )}

            <div className="mt-12 border-t border-white/5 pt-6 text-xs leading-relaxed text-muted">
              <p>
                Manchetes, resumos e imagens obtidos automaticamente dos canais RSS e das páginas públicas de cada fonte. O conteúdo e as imagens pertencem aos
                respectivos veículos e órgãos, e a leitura integral é feita no site de origem. A classificação por área é automática e serve apenas para orientar a navegação. A
                seleção não representa opinião da Ledesma Advocacia.
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                {(fonte ? [fonte] : fontesNoticias).map((f) => (
                  <li key={f.id}>
                    <a href={f.site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-gold">
                      {f.local} <Icon name="externo" className="size-3" />
                      <span className="sr-only">(abre em nova aba)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
