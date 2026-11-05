"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { areas } from "@/content/areas";
import { supabaseNavegador } from "@/lib/supabase/cliente";
import { ArtigoAbertura, ArtigoCorpo, ArtigoLateral } from "../ArtigoVisual";
import { buttonClasses } from "../Button";
import { Icon } from "../icons";
import {
  artigoDe,
  COLUNAS,
  type BlocoForm,
  type ErroCampo,
  excluir,
  type Formulario,
  formularioDe,
  formularioVazio,
  type LinhaArtigo,
  podeEditar,
  podeExcluir,
  salvar,
  type SecaoForm,
  slugificar,
  type Status,
  statusCms,
  validar,
} from "./artigos";
import { Ordenavel } from "./Ordenavel";
import type { Perfil } from "./sessao";

// Mesmo estilo dos campos do formulário de contato
const campo =
  "mt-2 block w-full rounded-[2px] border border-white/10 bg-ink/60 px-4 py-3 text-[0.95rem] text-ivory placeholder:text-muted/60 transition-colors duration-300 hover:border-gold/30 focus:border-gold focus:outline-none focus-visible:outline-none focus:ring-1 focus:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-60";
const rotulo = "text-[0.95rem] text-ivory";
const dica = "mt-1 text-sm text-muted";
const acaoPequena = "text-xs text-muted underline-offset-4 transition-colors hover:text-gold hover:underline disabled:pointer-events-none disabled:opacity-30";

const tiposBloco: { tipo: BlocoForm["tipo"]; nome: string; explica: string }[] = [
  { tipo: "p", nome: "Texto", explica: "um parágrafo comum" },
  { tipo: "lista", nome: "Lista", explica: "um item por linha" },
  { tipo: "nota", nome: "Destaque", explica: "um aviso em evidência" },
];
const nomeBloco = (t: BlocoForm["tipo"]) => tiposBloco.find((x) => x.tipo === t)!.nome;

function Campo({ id, titulo, ajuda, contador, children }: { id: string; titulo: string; ajuda?: string; contador?: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className={rotulo}>
          {titulo}
        </label>
        {contador && <span className="text-xs text-muted">{contador}</span>}
      </div>
      {ajuda && (
        <p id={`${id}-dica`} className={dica}>
          {ajuda}
        </p>
      )}
      {children}
    </div>
  );
}

function Passo({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`passo-${numero}`} className="card p-6 md:p-8">
      <p className="eyebrow !text-[0.66rem]">Passo {numero}</p>
      <h3 id={`passo-${numero}`} className="mt-3 text-2xl">
        {titulo}
      </h3>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

const mover = <T,>(lista: T[], de: number, para: number) => {
  if (para < 0 || para >= lista.length) return lista;
  const nova = [...lista];
  const [item] = nova.splice(de, 1);
  nova.splice(para, 0, item);
  return nova;
};

export function EditorArtigo({ id, perfil, aoVoltar }: { id: string | null; perfil: Perfil; aoVoltar: () => void }) {
  const uid = useId();
  const novoVazio = () => formularioVazio(perfil.integrante ? [perfil.integrante] : []);
  const [linha, setLinha] = useState<LinhaArtigo | null>(null);
  const [form, setForm] = useState<Formulario>(novoVazio);
  const [salvo, setSalvo] = useState(() => JSON.stringify(novoVazio()));
  const [carregando, setCarregando] = useState(id !== null);
  const [falhaCarga, setFalhaCarga] = useState(false);
  const [integrantes, setIntegrantes] = useState<{ slug: string; nome: string }[]>([]);
  const [aba, setAba] = useState<"escrever" | "ver">("escrever");
  const [erros, setErros] = useState<ErroCampo[]>([]);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [conformidade, setConformidade] = useState(false);
  const [slugManual, setSlugManual] = useState(id !== null);
  const [ocupado, setOcupado] = useState(false);
  const avisos = useRef<HTMLDivElement>(null);
  const janelaPublicar = useRef<HTMLDialogElement>(null);

  const alterado = JSON.stringify(form) !== salvo;
  const editavel = podeEditar(linha, perfil);
  const status: Status = linha?.status ?? "rascunho";
  const jaFoiAoAr = linha?.revisao_no_ar != null;

  // Carrega o artigo e a lista de integrantes (assinantes)
  useEffect(() => {
    const supabase = supabaseNavegador();
    let ativo = true;
    supabase
      .from("integrantes")
      .select("slug, nome")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => ativo && setIntegrantes(data ?? []));
    if (id) {
      supabase
        .from("artigos")
        .select(COLUNAS)
        .eq("id", id)
        .single()
        .then(({ data, error }) => {
          if (!ativo) return;
          if (error || !data) {
            setFalhaCarga(true);
          } else {
            const l = data as LinhaArtigo;
            const f = formularioDe(l);
            setLinha(l);
            setForm(f);
            setSalvo(JSON.stringify(f));
          }
          setCarregando(false);
        });
    }
    return () => {
      ativo = false;
    };
  }, [id]);

  // Avisa antes de fechar a aba com alterações não salvas
  useEffect(() => {
    if (!alterado) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [alterado]);

  const mudar = <K extends keyof Formulario>(k: K, v: Formulario[K]) => setForm((f) => ({ ...f, [k]: v }));
  const mudarSecoes = (fn: (s: SecaoForm[]) => SecaoForm[]) => setForm((f) => ({ ...f, secoes: fn(f.secoes) }));
  const mudarBlocos = (si: number, fn: (b: BlocoForm[]) => BlocoForm[]) => mudarSecoes((ss) => ss.map((s, i) => (i === si ? { ...s, blocos: fn(s.blocos) } : s)));

  function voltar() {
    if (alterado && !window.confirm("Há alterações não salvas. Sair mesmo assim?")) return;
    aoVoltar();
  }

  function mostrar(m: { tipo: "ok" | "erro"; texto: string }) {
    setMensagem(m);
    requestAnimationFrame(() => avisos.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    requestAnimationFrame(() => avisos.current?.focus({ preventScroll: true }));
  }

  /** Confere os campos; se houver problema, volta para a escrita e mostra a lista. */
  function conferir(publicar: boolean) {
    const problemas = validar(form, publicar);
    setErros(problemas);
    if (problemas.length) {
      setAba("escrever");
      mostrar({ tipo: "erro", texto: "Falta ajustar alguns pontos antes de salvar:" });
      return false;
    }
    return true;
  }

  async function gravar(novo: Status) {
    const publicar = novo === "publicado";
    setOcupado(true);
    const r = await salvar(supabaseNavegador(), { atual: linha, form, status: novo, confirmouConformidade: publicar && conformidade });
    setOcupado(false);
    janelaPublicar.current?.close();
    if (r.erro !== undefined) {
      mostrar({ tipo: "erro", texto: r.erro });
      return;
    }
    const f = formularioDe(r.linha);
    setLinha(r.linha);
    setForm(f);
    setSalvo(JSON.stringify(f));
    setSlugManual(true);
    setConformidade(false);
    setErros([]);
    mostrar({
      tipo: "ok",
      texto:
        novo === "rascunho"
          ? "Rascunho salvo. Só quem acessa o painel consegue vê-lo."
          : novo === "publicado"
            ? "Publicado. O site é atualizado sozinho em alguns minutos; a lista de artigos mostra quando estiver no ar."
            : "Retirado. O artigo sai do site em alguns minutos; a lista de artigos mostra quando terminar.",
    });
  }

  function salvarRascunho() {
    if (conferir(false)) gravar(status === "retirado" ? "retirado" : "rascunho");
  }

  /** Publicar (ou salvar um artigo já publicado) pede a confirmação da OAB numa janela. */
  function pedirPublicacao() {
    if (!conferir(true)) return;
    setConformidade(false);
    janelaPublicar.current?.showModal();
  }

  async function retirar() {
    if (!window.confirm("Retirar este artigo do site? Ele continua salvo aqui e pode ser publicado de novo depois.")) return;
    if (conferir(false)) gravar("retirado");
  }

  async function apagar() {
    if (!linha) return;
    const aviso =
      linha.status === "rascunho" && linha.revisao_no_ar === null
        ? "Excluir este rascunho? Não é possível desfazer."
        : "Excluir este artigo de vez? Ele sai do painel agora e do site em alguns minutos. Não é possível desfazer.";
    if (!window.confirm(aviso)) return;
    setOcupado(true);
    const erro = await excluir(supabaseNavegador(), linha.id);
    setOcupado(false);
    if (erro) mostrar({ tipo: "erro", texto: erro });
    else aoVoltar();
  }

  if (carregando) return <p className="text-sm text-muted" aria-live="polite">Abrindo o artigo…</p>;
  if (falhaCarga) {
    return (
      <div className="card max-w-xl p-7">
        <p className="text-ivory">Não foi possível abrir este artigo.</p>
        <button type="button" onClick={aoVoltar} className={`${buttonClasses("ghost")} mt-4`}>
          Voltar aos artigos
        </button>
      </div>
    );
  }

  const previa = artigoDe(form, linha?.atualizado_em ?? null);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Topo */}
      <button type="button" onClick={voltar} className="inline-flex items-center gap-2 text-sm text-gold hover:text-ivory">
        <Icon name="seta" className="size-4 rotate-180" /> Voltar aos artigos
      </button>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h2 className="text-3xl">{linha ? "Editar artigo" : "Novo artigo"}</h2>
        <span className="border border-gold/30 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold">{statusCms[status]}</span>
        {alterado && <span className="text-sm text-wine-text">alterações não salvas</span>}
      </div>

      <p className="mt-4 text-sm text-muted">
        Ao publicar, o site é atualizado sozinho em alguns minutos.
        {jaFoiAoAr && " Este artigo já está no site."}
      </p>

      {/* Escrever × ver */}
      <div role="tablist" aria-label="Modo" className="mt-6 grid grid-cols-2 border border-white/10">
        {(
          [
            ["escrever", "Escrever"],
            ["ver", "Ver como vai ficar"],
          ] as const
        ).map(([valor, nome]) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={aba === valor}
            onClick={() => setAba(valor)}
            className={`py-3 text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition-colors ${aba === valor ? "bg-gold/15 text-gold" : "text-muted hover:text-ivory"}`}
          >
            {nome}
          </button>
        ))}
      </div>

      {/* Mensagens */}
      <div ref={avisos} tabIndex={-1} className="mt-6 space-y-3 focus:outline-none">
        {!editavel && (
          <p className="border border-white/10 bg-ink/60 p-4 text-sm text-paper">Somente leitura: você pode editar os artigos que escreveu ou em que assina.</p>
        )}
        {mensagem && (
          <div
            role={mensagem.tipo === "erro" ? "alert" : "status"}
            className={`border p-4 text-sm text-ivory ${mensagem.tipo === "erro" ? "border-wine-text/40 bg-wine-deep/30" : "border-gold/40 bg-gold/10"}`}
          >
            <p className="flex items-start gap-3">
              <Icon name={mensagem.tipo === "erro" ? "alerta" : "check"} className={`mt-0.5 size-4.5 shrink-0 ${mensagem.tipo === "erro" ? "text-wine-text" : "text-gold"}`} />
              {mensagem.texto}
            </p>
            {mensagem.tipo === "erro" && erros.length > 0 && (
              <ul className="mt-3 space-y-1 pl-8">
                {erros.map((e) => (
                  <li key={`${e.campo}-${e.mensagem}`}>
                    <strong>{e.campo}:</strong> {e.mensagem}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {aba === "ver" ? (
        <div className="mt-6">
          {/* Largura total, como na página pública */}
          <div className="relative left-1/2 w-screen -translate-x-1/2 border-y border-gold/20">
            <ArtigoAbertura artigo={previa} />
            <div className="bg-ink py-16 md:py-24">
              <div className="container-site grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <ArtigoCorpo artigo={previa} />
                <ArtigoLateral artigo={previa} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <fieldset disabled={!editavel || ocupado} className="mt-6 space-y-6">
          <legend className="sr-only">Dados do artigo</legend>

          <Passo numero={1} titulo="Sobre o artigo">
            <Campo id={`${uid}-titulo`} titulo="Título" contador={`${form.titulo.length}/160`}>
              <input
                id={`${uid}-titulo`}
                value={form.titulo}
                maxLength={160}
                placeholder="Ex.: Pensão alimentícia: como o valor é definido"
                onChange={(e) => {
                  const titulo = e.target.value;
                  setForm((f) => ({ ...f, titulo, slug: slugManual || jaFoiAoAr ? f.slug : slugificar(titulo) }));
                }}
                className={`${campo} font-serif text-xl`}
              />
            </Campo>
            <Campo id={`${uid}-area`} titulo="Área">
              <div className="relative">
                <select id={`${uid}-area`} value={form.area} onChange={(e) => mudar("area", e.target.value as Formulario["area"])} className={`${campo} appearance-none pr-10`}>
                  <option value="">Escolha a área</option>
                  {areas.map((a) => (
                    <option key={a.slug} value={a.slug}>
                      {a.nome}
                    </option>
                  ))}
                </select>
                <Icon name="setaBaixo" className="pointer-events-none absolute right-4 top-1/2 mt-1 size-4 -translate-y-1/2 text-gold" />
              </div>
            </Campo>
            <Campo id={`${uid}-resumo`} titulo="Resumo" contador={`${form.resumo.length}/300`} ajuda="Uma ou duas frases que aparecem abaixo do título.">
              <textarea
                id={`${uid}-resumo`}
                rows={2}
                maxLength={300}
                value={form.resumo}
                onChange={(e) => {
                  const resumo = e.target.value.replace(/\n/g, " ");
                  // A descrição para o Google acompanha o resumo enquanto for igual a ele (ou vazia)
                  setForm((f) => ({ ...f, resumo, descricao: !f.descricao || f.descricao === f.resumo ? "" : f.descricao }));
                }}
                className={campo}
                aria-describedby={`${uid}-resumo-dica`}
              />
            </Campo>
          </Passo>

          <Passo numero={2} titulo="Texto">
            <p className="-mt-2 text-sm text-muted">
              Organize o artigo em subtítulos. Abaixo de cada um, escreva quantos trechos quiser:{" "}
              {tiposBloco.map((t, i) => (
                <span key={t.tipo}>
                  {i > 0 && " · "}
                  <span className="text-paper">{t.nome}</span> ({t.explica})
                </span>
              ))}
              .
            </p>

            <Ordenavel itens={form.secoes} aoMover={(de, para) => mudarSecoes((ss) => mover(ss, de, para))} rotulo={(i) => `subtítulo ${i + 1}`} className="space-y-6">
              {(s, si, alcaSecao) => (
              <div className="border border-white/10 bg-coal p-5 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    {alcaSecao}
                    <label htmlFor={`${uid}-s${si}`} className={rotulo}>
                      Subtítulo {form.secoes.length > 1 && si + 1}
                    </label>
                  </span>
                  <button
                    type="button"
                    className={acaoPequena}
                    disabled={form.secoes.length === 1}
                    onClick={() => window.confirm("Apagar este subtítulo e tudo o que está abaixo dele?") && mudarSecoes((ss) => ss.filter((_, i) => i !== si))}
                  >
                    Apagar
                  </button>
                </div>
                <input
                  id={`${uid}-s${si}`}
                  value={s.titulo}
                  maxLength={160}
                  placeholder="Ex.: Quem pode pedir pensão"
                  onChange={(e) => mudarSecoes((ss) => ss.map((x, i) => (i === si ? { ...x, titulo: e.target.value } : x)))}
                  className={`${campo} font-serif text-lg`}
                />

                <Ordenavel
                  itens={s.blocos}
                  aoMover={(de, para) => mudarBlocos(si, (bs) => mover(bs, de, para))}
                  rotulo={(i) => `trecho ${i + 1} do subtítulo ${si + 1}`}
                  className="mt-5 space-y-5"
                >
                  {(b, bi, alcaBloco) => {
                    const idb = `${uid}-s${si}-b${bi}`;
                    return (
                      <div className="bg-coal">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1">
                            {alcaBloco}
                            <label htmlFor={idb} className="text-sm text-gold">
                              {nomeBloco(b.tipo)}
                              {b.tipo === "lista" && <span className="text-muted"> (um item por linha)</span>}
                            </label>
                          </span>
                          <button type="button" className={acaoPequena} disabled={s.blocos.length === 1} onClick={() => mudarBlocos(si, (bs) => bs.filter((_, i) => i !== bi))}>
                            Apagar
                          </button>
                        </div>
                        <textarea
                          id={idb}
                          rows={b.tipo === "p" ? 5 : 3}
                          value={b.texto}
                          onChange={(e) => {
                            // Texto e destaque são um parágrafo só no site; a lista usa uma linha por item
                            const texto = b.tipo === "lista" ? e.target.value : e.target.value.replace(/\n/g, " ");
                            mudarBlocos(si, (bs) => bs.map((x, i) => (i === bi ? { ...x, texto } : x)));
                          }}
                          className={`${campo} ${b.tipo === "nota" ? "border-l-2 border-l-gold/60" : ""}`}
                        />
                      </div>
                    );
                  }}
                </Ordenavel>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">Acrescentar:</span>
                  {tiposBloco.map((t) => (
                    <button
                      key={t.tipo}
                      type="button"
                      onClick={() => mudarBlocos(si, (bs) => [...bs, { tipo: t.tipo, texto: "" }])}
                      className="border border-white/15 px-3 py-1.5 text-sm text-paper transition-colors hover:border-gold/60 hover:text-gold"
                    >
                      + {t.nome}
                    </button>
                  ))}
                </div>
              </div>
              )}
            </Ordenavel>

            <button type="button" onClick={() => mudarSecoes((ss) => [...ss, { titulo: "", blocos: [{ tipo: "p", texto: "" }] }])} className={buttonClasses("outline")}>
              + Novo subtítulo
            </button>

            <Campo id={`${uid}-refs`} titulo="Referências legais (opcional)" ajuda="Uma por linha. Ex.: Código Civil, arts. 1.694 a 1.699">
              <textarea id={`${uid}-refs`} rows={3} value={form.referencias} onChange={(e) => mudar("referencias", e.target.value)} className={campo} aria-describedby={`${uid}-refs-dica`} />
            </Campo>
          </Passo>

          <Passo numero={3} titulo="Assinatura">
            <fieldset>
              <legend className={rotulo}>Quem assina</legend>
              <p className={dica}>Os nomes aparecem no fim do artigo.</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {integrantes.map((p) => (
                  <li key={p.slug}>
                    <label className="flex h-full cursor-pointer items-center gap-3 border border-white/10 px-4 py-3 text-sm text-paper transition-colors has-[:checked]:border-gold/60 has-[:checked]:bg-gold/5 hover:border-gold/30">
                      <input
                        type="checkbox"
                        checked={form.assinantes.includes(p.slug)}
                        onChange={(e) => mudar("assinantes", e.target.checked ? [...form.assinantes, p.slug] : form.assinantes.filter((x) => x !== p.slug))}
                        className="size-4 shrink-0 accent-[var(--color-gold)]"
                      />
                      {p.nome}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

          </Passo>

        </fieldset>
      )}

      {/* Botões, sempre visíveis no rodapé da tela */}
      {editavel && (
        <div className="sticky bottom-0 z-20 mt-8 border-t border-gold/20 bg-coal/95 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            {status === "publicado" ? (
              <>
                <button type="button" disabled={ocupado || !alterado} onClick={pedirPublicacao} className={buttonClasses("primary")}>
                  {ocupado ? "Salvando…" : "Salvar alterações"}
                </button>
                <button type="button" disabled={ocupado} onClick={retirar} className={buttonClasses("outline")}>
                  Retirar do site
                </button>
              </>
            ) : (
              <>
                <button type="button" disabled={ocupado} onClick={salvarRascunho} className={buttonClasses("outline")}>
                  {ocupado ? "Salvando…" : "Salvar rascunho"}
                </button>
                <button type="button" disabled={ocupado} onClick={pedirPublicacao} className={buttonClasses("primary")}>
                  Publicar
                </button>
              </>
            )}
            {linha && podeExcluir(linha, perfil) && (
              <button type="button" disabled={ocupado} onClick={apagar} className={`${acaoPequena} ml-auto !text-sm`}>
                {linha.status === "rascunho" ? "Excluir rascunho" : "Excluir artigo"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmação de publicação (regras de publicidade da OAB) */}
      <dialog
        ref={janelaPublicar}
        aria-labelledby={`${uid}-pub`}
        onClick={(e) => e.target === e.currentTarget && janelaPublicar.current?.close()}
        className="m-auto w-[min(100%-2rem,32rem)] border border-gold/20 bg-coal p-0 text-paper shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 md:p-8">
          <h2 id={`${uid}-pub`} className="text-2xl">
            {status === "publicado" ? "Salvar as alterações?" : "Publicar o artigo?"}
          </h2>
          <label className="mt-5 flex items-start gap-3 text-sm text-paper">
            <input type="checkbox" checked={conformidade} onChange={(e) => setConformidade(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--color-gold)]" />
            <span>
              Revisei o texto: ele é informativo, não promete resultado e segue as regras de publicidade da advocacia (Provimento OAB nº 205/2021).
            </span>
          </label>
          <p className="mt-4 text-xs text-muted">Depois de confirmar, o site é atualizado sozinho em alguns minutos.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" disabled={!conformidade || ocupado} onClick={() => gravar("publicado")} className={buttonClasses("primary")}>
              {ocupado ? "Salvando…" : status === "publicado" ? "Salvar" : "Publicar"}
            </button>
            <button type="button" onClick={() => janelaPublicar.current?.close()} className={buttonClasses("ghost")}>
              Cancelar
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
