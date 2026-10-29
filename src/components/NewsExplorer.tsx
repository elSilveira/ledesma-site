"use client";

import { useMemo, useState } from "react";
import type { AreaSlug } from "@/config/site";
import { areas } from "@/content/areas";
import type { Noticia, Tribunal } from "@/lib/noticias-shared";
import { buttonClasses } from "./Button";
import { Icon } from "./icons";
import { NewsCard } from "./NewsCard";

const POR_PAGINA = 6;

const ROTULOS_TRIBUNAL: Record<Tribunal, string> = {
  STF: "STF",
  STJ: "STJ",
  TST: "TST",
  TSE: "TSE",
  CNJ: "CNJ",
  TRF: "TRFs (Justiça Federal)",
  TRT: "TRTs (Justiça do Trabalho)",
  TJ: "TJs (Justiça Estadual)",
  TRE: "TREs (Justiça Eleitoral)",
};

/** Lista de notícias com filtros por área do escritório, tribunal de referência e região. */
export function NewsExplorer({ itens }: { itens: Noticia[] }) {
  const [area, setArea] = useState<AreaSlug | "todas" | "outras">("todas");
  const [tribunal, setTribunal] = useState<Tribunal | "todos">("todos");
  const [regional, setRegional] = useState(false);
  const [limite, setLimite] = useState(POR_PAGINA);

  // Só oferece os tribunais que aparecem nas notícias carregadas
  const tribunaisDisponiveis = useMemo(
    () => (Object.keys(ROTULOS_TRIBUNAL) as Tribunal[]).filter((t) => itens.some((n) => n.tribunais.includes(t))),
    [itens],
  );
  const contagemArea = (a: AreaSlug) => itens.filter((n) => n.areas.includes(a)).length;

  const filtradas = itens.filter(
    (n) =>
      (area === "todas" || (area === "outras" ? n.areas.length === 0 : n.areas.includes(area))) &&
      (tribunal === "todos" || n.tribunais.includes(tribunal)) &&
      (!regional || n.regional),
  );
  const visiveis = filtradas.slice(0, limite);

  const mudar = (fn: () => void) => {
    fn();
    setLimite(POR_PAGINA);
  };

  const chip = (ativo: boolean) =>
    `inline-flex items-center gap-2 border px-3.5 py-2 text-xs font-medium transition-colors duration-300 ${
      ativo ? "border-gold/60 bg-gold/10 text-ivory" : "border-white/10 text-paper hover:border-gold/30"
    }`;

  const temFiltro = area !== "todas" || tribunal !== "todos" || regional;

  return (
    <div>
      <div className="card space-y-6 p-6 md:p-7">
        <fieldset>
          <legend className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold">Área do escritório</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" aria-pressed={area === "todas"} onClick={() => mudar(() => setArea("todas"))} className={chip(area === "todas")}>
              Todas <span className="text-muted">{itens.length}</span>
            </button>
            {areas.map((a) => (
              <button key={a.slug} type="button" aria-pressed={area === a.slug} onClick={() => mudar(() => setArea(a.slug))} className={chip(area === a.slug)}>
                <Icon name={a.icone} className="size-4 text-gold" /> {a.nomeCurto} <span className="text-muted">{contagemArea(a.slug)}</span>
              </button>
            ))}
            <button type="button" aria-pressed={area === "outras"} onClick={() => mudar(() => setArea("outras"))} className={chip(area === "outras")}>
              Outros temas <span className="text-muted">{itens.filter((n) => n.areas.length === 0).length}</span>
            </button>
          </div>
        </fieldset>

        <div className="flex flex-col gap-6 md:flex-row md:items-end">
          <div className="md:w-80">
            <label htmlFor="filtro-tribunal" className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold">
              Tribunal de referência
            </label>
            <div className="relative mt-3">
              <select
                id="filtro-tribunal"
                value={tribunal}
                onChange={(e) => mudar(() => setTribunal(e.target.value as Tribunal | "todos"))}
                className="block w-full appearance-none rounded-[2px] border border-white/10 bg-ink/60 px-4 py-2.5 pr-10 text-sm text-ivory transition-colors hover:border-gold/30 focus:border-gold focus:outline-none"
              >
                <option value="todos">Todos os tribunais</option>
                {tribunaisDisponiveis.map((t) => (
                  <option key={t} value={t}>
                    {ROTULOS_TRIBUNAL[t]}
                  </option>
                ))}
              </select>
              <Icon name="setaBaixo" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gold" />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-paper md:pb-2.5">
            <input type="checkbox" checked={regional} onChange={(e) => mudar(() => setRegional(e.target.checked))} className="size-4 accent-wine" />
            Somente menções ao Paraná e Mato Grosso do Sul
          </label>
          {temFiltro && (
            <button
              type="button"
              onClick={() => mudar(() => (setArea("todas"), setTribunal("todos"), setRegional(false)))}
              className="text-sm text-gold underline underline-offset-4 hover:text-ivory md:ml-auto md:pb-2.5"
            >
              Limpar filtros
            </button>
          )}
        </div>
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
          <p className="font-serif text-xl text-ivory">Nenhuma notícia com esses filtros.</p>
          <p className="mt-2 text-sm text-muted">Tente outra combinação ou limpe os filtros.</p>
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
