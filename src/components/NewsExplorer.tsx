"use client";

import { useState, useSyncExternalStore } from "react";
import type { AreaSlug } from "@/config/site";
import { areas } from "@/content/areas";
import type { Noticia } from "@/lib/noticias-shared";
import { buttonClasses } from "./Button";
import { Icon } from "./icons";
import { NewsCard } from "./NewsCard";

const POR_PAGINA = 6;

type FiltroArea = AreaSlug | "todas" | "outras";

// A URL só muda por escolha do próprio usuário nesta tela, então não há o que observar
const semInscricao = () => () => {};

const ehFiltroArea = (v: string | null): v is FiltroArea => v === "outras" || areas.some((a) => a.slug === v);

/**
 * Lista de notícias com filtro por área do escritório.
 * A área pode vir na URL (`/noticias?area=direito-trabalhista`), como nos links das páginas de área.
 */
export function NewsExplorer({ itens }: { itens: Noticia[] }) {
  // A página é estática: a área da URL só é lida no navegador (no servidor, "todas")
  const busca = useSyncExternalStore(semInscricao, () => window.location.search, () => "");
  const daUrl = new URLSearchParams(busca).get("area");
  const [escolhida, setEscolhida] = useState<FiltroArea | null>(null);
  const area: FiltroArea = escolhida ?? (ehFiltroArea(daUrl) ? daUrl : "todas");

  const escolherArea = (a: FiltroArea) => {
    setEscolhida(a);
    const url = new URL(window.location.href);
    if (a === "todas") url.searchParams.delete("area");
    else url.searchParams.set("area", a);
    window.history.replaceState(window.history.state, "", url);
  };
  const [limite, setLimite] = useState(POR_PAGINA);

  const contagemArea = (a: AreaSlug) => itens.filter((n) => n.areas.includes(a)).length;

  const filtradas = itens.filter((n) => area === "todas" || (area === "outras" ? n.areas.length === 0 : n.areas.includes(area)));
  const visiveis = filtradas.slice(0, limite);

  const mudar = (fn: () => void) => {
    fn();
    setLimite(POR_PAGINA);
  };

  const chip = (ativo: boolean) =>
    `inline-flex items-center gap-2 border px-3.5 py-2 text-xs font-medium transition-colors duration-300 ${
      ativo ? "border-gold/60 bg-gold/10 text-ivory" : "border-white/10 text-paper hover:border-gold/30"
    }`;

  return (
    <div>
      <div className="card p-6 md:p-7">
        <fieldset>
          <legend className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold">Área do escritório</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" aria-pressed={area === "todas"} onClick={() => mudar(() => escolherArea("todas"))} className={chip(area === "todas")}>
              Todas <span className="text-muted">{itens.length}</span>
            </button>
            {areas.map((a) => (
              <button key={a.slug} type="button" aria-pressed={area === a.slug} onClick={() => mudar(() => escolherArea(a.slug))} className={chip(area === a.slug)}>
                <Icon name={a.icone} className="size-4 text-gold" /> {a.nomeCurto} <span className="text-muted">{contagemArea(a.slug)}</span>
              </button>
            ))}
            <button type="button" aria-pressed={area === "outras"} onClick={() => mudar(() => escolherArea("outras"))} className={chip(area === "outras")}>
              Outros temas <span className="text-muted">{itens.filter((n) => n.areas.length === 0).length}</span>
            </button>
          </div>
        </fieldset>
      </div>

      <p aria-live="polite" className="mt-8 text-sm text-muted">
        {filtradas.length === 1 ? "1 notícia encontrada" : `${filtradas.length} notícias encontradas`}
      </p>

      {visiveis.length > 0 ? (
        <ul className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((n) => (
            <li key={n.id}>
              <NewsCard noticia={n} headingLevel="h2" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-5 p-10 text-center">
          <p className="font-serif text-xl text-ivory">Nenhuma notícia nesta área por enquanto.</p>
          <p className="mt-2 text-sm text-muted">Escolha outra área ou veja todas.</p>
        </div>
      )}

      {filtradas.length > limite && (
        <div className="mt-10 text-center">
          <button type="button" onClick={() => setLimite((l) => l + POR_PAGINA)} className={buttonClasses("outline")}>
            Carregar mais notícias
            <span className="text-muted">({filtradas.length - limite})</span>
          </button>
        </div>
      )}
    </div>
  );
}
