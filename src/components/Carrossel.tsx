"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";

const INTERVALO = 6000;

const botao =
  "grid size-11 place-items-center border border-gold/30 text-gold transition-colors hover:border-gold hover:text-ivory";

/**
 * Faixa com rolagem lateral (arrastar no celular) que avança sozinha a cada 6 s, como o slider do site antigo.
 * Para com o mouse ou o foco do teclado sobre ela, pelo botão de pausa e quando o sistema pede menos movimento.
 */
export function Carrossel({ children, rotulo }: { children: ReactNode; rotulo: string }) {
  const trilho = useRef<HTMLUListElement>(null);
  const itens = Children.toArray(children);
  const [atual, setAtual] = useState(0);
  const [paginas, setPaginas] = useState(itens.length);
  const [pausado, setPausado] = useState(false);
  const [sobre, setSobre] = useState(false);
  const [suave, setSuave] = useState(true);

  const passo = useCallback(() => {
    const t = trilho.current;
    const [a, b] = t ? [...t.children] : [];
    return a instanceof HTMLElement && b instanceof HTMLElement ? b.offsetLeft - a.offsetLeft : (t?.clientWidth ?? 1);
  }, []);

  const ir = useCallback(
    (i: number) => trilho.current?.scrollTo({ left: i * passo(), behavior: suave ? "smooth" : "auto" }),
    [passo, suave],
  );

  useEffect(() => {
    const t = trilho.current;
    if (!t) return;
    const medir = () => {
      const p = passo();
      const visiveis = Math.max(1, Math.round(t.clientWidth / p));
      setPaginas(Math.max(1, itens.length - visiveis + 1));
      setAtual(Math.round(t.scrollLeft / p));
    };
    const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSuave(!reduzir);
    setPausado(reduzir);
    medir();
    t.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      t.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [passo, itens.length]);

  // Reinicia a contagem a cada mudança, inclusive quando a pessoa arrasta ou clica.
  useEffect(() => {
    if (pausado || sobre || paginas <= 1) return;
    const id = setTimeout(() => {
      if (!document.hidden) ir(atual + 1 >= paginas ? 0 : atual + 1);
    }, INTERVALO);
    return () => clearTimeout(id);
  }, [atual, paginas, pausado, sobre, ir]);

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label={rotulo}
      onMouseEnter={() => setSobre(true)}
      onMouseLeave={() => setSobre(false)}
      onFocus={() => setSobre(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setSobre(false)}
    >
      <ul
        ref={trilho}
        className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:gap-5 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {itens.map((item, i) => (
          <li
            key={i}
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${itens.length}`}
            className="flex shrink-0 basis-[85%] snap-start sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-2.5rem)/3)]"
          >
            {item}
          </li>
        ))}
      </ul>

      {paginas > 1 && (
        <div className="mt-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            {Array.from({ length: paginas }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ir para a posição ${i + 1} de ${paginas}`}
                aria-current={i === atual ? "true" : undefined}
                className="grid h-6 place-items-center"
              >
                <span
                  className={`block h-0.5 transition-all duration-300 ${i === atual ? "w-8 bg-gold" : "w-4 bg-white/20 hover:bg-white/40"}`}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => ir(atual - 1 < 0 ? paginas - 1 : atual - 1)} aria-label="Avaliação anterior" className={botao}>
              <Icon name="seta" className="size-5 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => setPausado((p) => !p)}
              aria-label={pausado ? "Retomar rotação automática" : "Pausar rotação automática"}
              className={botao}
            >
              <Icon name={pausado ? "play" : "pausa"} className="size-4.5" />
            </button>
            <button type="button" onClick={() => ir(atual + 1 >= paginas ? 0 : atual + 1)} aria-label="Próxima avaliação" className={botao}>
              <Icon name="seta" className="size-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
