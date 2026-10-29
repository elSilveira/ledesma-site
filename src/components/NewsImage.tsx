"use client";

import { useState } from "react";

/**
 * Imagem de destaque da notícia, carregada do servidor da própria fonte.
 * Sem imagem (ou se ela falhar), mostra um quadro com o nome da fonte para manter o alinhamento da grade.
 */
export function NewsImage({ src, fonte }: { src: string | null; fonte: string }) {
  const [falhou, setFalhou] = useState(false);
  return (
    <div className="relative aspect-[16/9] overflow-hidden border-b border-gold/10 bg-gradient-to-br from-slate to-ink">
      {src && !falhou ? (
        // Imagem externa de terceiros: <img> simples, sem passar pelo otimizador do Next
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFalhou(true)}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center font-serif text-2xl text-gold/40">
          {fonte}
        </span>
      )}
    </div>
  );
}
