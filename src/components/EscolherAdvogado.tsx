"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { equipe, linkWhatsApp, mensagemPadrao, nomeComTratamento } from "@/config/site";
import { getArea } from "@/content/areas";
import { Icon } from "./icons";

/**
 * Botão "Fale com o escritório": abre uma janela para escolher o advogado e segue para o WhatsApp dele
 * com a mensagem pronta. Sem JavaScript, continua sendo um link para /contato.
 */
export function EscolherAdvogado({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const janela = useRef<HTMLDialogElement>(null);
  const fechar = () => janela.current?.close();

  return (
    <>
      <Link
        href="/contato"
        aria-haspopup="dialog"
        className={className}
        onClick={(e) => {
          e.preventDefault();
          janela.current?.showModal();
        }}
      >
        {children}
      </Link>

      <dialog
        ref={janela}
        aria-labelledby="escolher-advogado"
        onClick={(e) => e.target === e.currentTarget && fechar()}
        className="m-auto w-[min(100%-2rem,30rem)] border border-gold/20 bg-coal p-0 text-paper shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Atendimento pelo WhatsApp</p>
              <h2 id="escolher-advogado" className="mt-3 text-2xl md:text-3xl">
                Com quem você quer falar?
              </h2>
            </div>
            <button type="button" onClick={fechar} aria-label="Fechar" className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center text-muted hover:text-ivory">
              <Icon name="fechar" className="size-5" />
            </button>
          </div>
          <p className="mt-3 text-sm text-muted">Escolha o advogado da área do seu assunto. A conversa abre com uma mensagem pronta para enviar.</p>

          <ul className="mt-6 space-y-3">
            {equipe.map((p) => {
              const area = getArea(p.area);
              const wa = linkWhatsApp(p, mensagemPadrao(p, area.nome));
              if (!wa) return null;
              return (
                <li key={p.slug}>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={fechar}
                    className="group flex items-center gap-4 border border-white/5 bg-graphite/60 p-3 pr-4 transition-colors hover:border-gold/40 hover:bg-graphite"
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden bg-slate">
                      <Image src={p.foto.src} alt="" fill sizes="56px" className="object-cover object-top" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-lg leading-tight text-ivory transition-colors group-hover:text-gold">
                        {nomeComTratamento(p)}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <Icon name={area.icone} className="size-3.5 text-gold" /> {area.nome}
                      </span>
                    </span>
                    <Icon name="whatsapp" className="size-6 shrink-0 text-gold" />
                    <span className="sr-only">(abre o WhatsApp em nova aba)</span>
                  </a>
                </li>
              );
            })}
          </ul>

          <Link href="/contato" onClick={fechar} className="mt-6 inline-flex items-center gap-2 text-sm text-gold hover:text-ivory">
            Ver telefones, endereços e formulário <Icon name="seta" className="size-4" />
          </Link>
        </div>
      </dialog>
    </>
  );
}
