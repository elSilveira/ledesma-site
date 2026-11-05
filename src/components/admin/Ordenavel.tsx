"use client";

import { type CSSProperties, type KeyboardEvent, type PointerEvent as EventoPonteiro, type ReactNode, useEffect, useRef, useState } from "react";
import { Icon } from "../icons";

type Arrasto = { de: number; para: number; dy: number; altura: number };

/**
 * Lista que muda de ordem arrastando pela alça (mouse ou toque), sem bibliotecas.
 * Pelo teclado, a alça aceita as setas para cima e para baixo.
 */
export function Ordenavel<T>({
  itens,
  aoMover,
  rotulo,
  className = "",
  children,
}: {
  itens: T[];
  aoMover: (de: number, para: number) => void;
  /** Nome do item para leitores de tela, ex.: "subtítulo 2" */
  rotulo: (i: number) => string;
  className?: string;
  children: (item: T, i: number, alca: ReactNode) => ReactNode;
}) {
  const lista = useRef<HTMLDivElement>(null);
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);
  // Item que acabou de mudar de lugar: fica destacado por um instante
  // `vez` alterna a animação para ela recomeçar mesmo quando o mesmo lugar recebe outra troca
  const [movido, setMovido] = useState<{ indice: number; vez: number } | null>(null);
  const [aviso, setAviso] = useState("");
  const tempo = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(tempo.current), []);

  function concluir(de: number, para: number) {
    aoMover(de, para);
    setMovido((m) => ({ indice: para, vez: (m?.vez ?? 0) + 1 }));
    setAviso(`${rotulo(de)} movido para a posição ${para + 1}`);
    clearTimeout(tempo.current);
    tempo.current = setTimeout(() => setMovido(null), 1700);
  }

  const elementos = () => [...(lista.current?.children ?? [])] as HTMLElement[];
  const focarAlca = (i: number) => requestAnimationFrame(() => elementos()[i]?.querySelector<HTMLElement>("[data-alca]")?.focus());

  function iniciar(e: EventoPonteiro<HTMLButtonElement>, de: number) {
    if (e.button !== 0 || itens.length < 2) return;
    e.preventDefault();
    // Posições na página no início do arrasto (não mudam com a rolagem)
    const caixas = elementos().map((el) => {
      const r = el.getBoundingClientRect();
      return { topo: r.top + window.scrollY, altura: r.height };
    });
    const espaco = caixas.length > 1 ? Math.max(0, caixas[1].topo - (caixas[0].topo + caixas[0].altura)) : 0;
    const altura = caixas[de].altura + espaco;
    const inicio = e.clientY + window.scrollY;
    let ultimoY = e.clientY;
    let para = de;
    let quadro = 0;

    const atualizar = () => {
      const dy = ultimoY + window.scrollY - inicio;
      const centro = caixas[de].topo + caixas[de].altura / 2 + dy;
      para = caixas.reduce((n, c, i) => (i !== de && c.topo + c.altura / 2 < centro ? n + 1 : n), 0);
      setArrasto({ de, para, dy, altura });
    };
    // Rola a página ao chegar perto da borda da tela (útil para textos longos)
    const rolar = () => {
      const margem = 80;
      if (ultimoY < margem) window.scrollBy(0, -12);
      else if (ultimoY > window.innerHeight - margem) window.scrollBy(0, 12);
      atualizar();
      quadro = requestAnimationFrame(rolar);
    };
    const mover = (ev: PointerEvent) => {
      ultimoY = ev.clientY;
      atualizar();
    };
    const soltar = () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
      setArrasto(null);
      if (para !== de) concluir(de, para);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    quadro = requestAnimationFrame(rolar);
    setArrasto({ de, para, dy: 0, altura });
  }

  function teclado(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const para = e.key === "ArrowUp" ? i - 1 : e.key === "ArrowDown" ? i + 1 : null;
    if (para === null) return;
    e.preventDefault();
    if (para < 0 || para >= itens.length) return;
    concluir(i, para);
    focarAlca(para);
  }

  /** O item arrastado segue o ponteiro; os do caminho abrem espaço para ele. */
  function estilo(i: number): CSSProperties | undefined {
    // Brilho dourado que desbota no item que acabou de chegar (keyframes em globals.css)
    if (!arrasto) {
      return movido?.indice === i ? { animation: `destaque-ordem-${movido.vez % 2 ? "a" : "b"} 1.6s ease-out` } : undefined;
    }
    const { de, para, dy, altura } = arrasto;
    if (i === de) return { transform: `translateY(${dy}px) scale(1.015)`, position: "relative", zIndex: 10 };
    const desloca = de < para && i > de && i <= para ? -altura : para < de && i >= para && i < de ? altura : 0;
    return { transform: `translateY(${desloca}px)`, transition: "transform 150ms ease" };
  }

  return (
    <div ref={lista} className={`${className} ${arrasto ? "select-none" : ""}`}>
      {itens.map((item, i) => (
        <div
          key={i}
          style={estilo(i)}
          className={arrasto?.de === i ? "shadow-2xl shadow-black/60 ring-2 ring-gold" : undefined}
        >
          {children(
            item,
            i,
            itens.length > 1 ? (
              <button
                type="button"
                data-alca
                aria-label={`Mover ${rotulo(i)}: arraste ou use as setas para cima e para baixo`}
                onPointerDown={(e) => iniciar(e, i)}
                onKeyDown={(e) => teclado(e, i)}
                className={`grid size-8 shrink-0 touch-none place-items-center text-muted transition-colors hover:text-gold focus-visible:text-gold ${arrasto?.de === i ? "cursor-grabbing text-gold" : "cursor-grab"}`}
              >
                <Icon name="arrastar" className="size-5" />
              </button>
            ) : null,
          )}
        </div>
      ))}
      <p className="sr-only" aria-live="polite">
        {aviso}
      </p>
    </div>
  );
}
