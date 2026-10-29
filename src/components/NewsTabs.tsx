"use client";

import Link from "next/link";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import type { Noticia } from "@/lib/noticias-shared";
import { Icon } from "./icons";
import { NewsCard } from "./NewsCard";

export type GrupoNoticias = { id: string; rotulo: string; descricao: string; href: string; itens: Noticia[] };

/** Abas de notícias da página inicial (padrão WAI-ARIA Tabs, com navegação pelas setas). */
export function NewsTabs({ grupos }: { grupos: GrupoNoticias[] }) {
  const uid = useId();
  const [ativo, setAtivo] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const grupo = grupos[ativo];

  function onKey(e: KeyboardEvent) {
    const n = grupos.length;
    const destino = { ArrowRight: (ativo + 1) % n, ArrowLeft: (ativo - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    setAtivo(destino);
    tabsRef.current[destino]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Categorias de notícias" onKeyDown={onKey} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {grupos.map((g, i) => (
          <button
            key={g.id}
            ref={(el) => {
              tabsRef.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${g.id}`}
            aria-selected={i === ativo}
            aria-controls={`${uid}-painel`}
            tabIndex={i === ativo ? 0 : -1}
            onClick={() => setAtivo(i)}
            className={`shrink-0 border px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-300 ${
              i === ativo ? "border-gold/60 bg-gold/10 text-ivory" : "border-white/10 text-muted hover:border-gold/30 hover:text-paper"
            }`}
          >
            {g.rotulo}
            <span className="ml-2 text-gold/80">{g.itens.length}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${uid}-painel`} aria-labelledby={`${uid}-tab-${grupo.id}`} tabIndex={0} className="mt-8 focus:outline-none">
        <p className="text-sm text-muted">{grupo.descricao}</p>
        <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {grupo.itens.slice(0, 6).map((n) => (
            <li key={n.id}>
              <NewsCard noticia={n} />
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link href={grupo.href} className="group inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-gold hover:text-ivory">
            {grupo.id === "todas" ? "Ver todas as notícias" : `Mais em ${grupo.rotulo}`}
            <Icon name="seta" className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
