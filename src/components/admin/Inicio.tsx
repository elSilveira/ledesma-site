"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getArea } from "@/content/areas";
import { supabaseNavegador } from "@/lib/supabase/cliente";
import { buttonClasses } from "../Button";
import { Icon } from "../icons";
import { COLUNAS, excluir, formularioDe, type LinhaArtigo, noSite, podeEditar, podeExcluir, salvar, type Status, statusCms, validar } from "./artigos";
import { EditorArtigo } from "./EditorArtigo";
import { TelaUsuarios } from "./Usuarios";
import type { Perfil } from "./sessao";

type Resumo = Pick<LinhaArtigo, "id" | "slug" | "titulo" | "resumo" | "area" | "status" | "revisao" | "revisao_no_ar" | "modificado_em" | "assinantes" | "criado_por">;
/** Atualização do site: pedidos ainda não confirmados no ar e o último deploy registrado. */
type SituacaoSite = {
  pendentes: number;
  ultimo: { situacao: "disparado" | "em_andamento" | "concluido" | "falhou" | "cancelado"; concluido_em: string | null } | null;
  ultimaConclusao: string | null;
};
type Dados = { nome: string | null; artigos: Resumo[]; site: SituacaoSite };

// Enquanto houver atualização pendente, a lista é recarregada para mostrar quando entrar no ar
const INTERVALO_ATUALIZACAO = 20_000;
// Dourado: no ar · marfim: a caminho do site · cinza: fora do site (vermelho fica só para erro)
const tomSite = { ok: "text-gold", pendente: "text-ivory", neutro: "text-muted" };

const selo: Record<Status, string> = {
  rascunho: "border-white/20 text-paper",
  publicado: "border-gold/50 text-gold",
  retirado: "border-wine-text/50 text-wine-text",
};

// Selo, "Editar" e "Excluir": a mesma caixa (altura, largura mínima, letra e alinhamento)
const pilula =
  "inline-flex h-7 min-w-[6.25rem] items-center justify-center gap-1.5 border px-2.5 text-[0.66rem] font-semibold uppercase leading-none tracking-[0.12em]";

const dataCurta = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Aviso sobre a atualização do site, com a situação real (só "atualizado" depois do deploy confirmado). */
function AvisoSite({ site }: { site: SituacaoSite }) {
  const { pendentes, ultimo, ultimaConclusao } = site;
  if (pendentes === 0) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted">
        <Icon name="check" className="size-4 text-gold" />
        Site atualizado{ultimaConclusao ? ` em ${dataHora(ultimaConclusao)}` : ""}.
      </p>
    );
  }
  const plural = pendentes === 1 ? "1 alteração" : `${pendentes} alterações`;
  if (ultimo && (ultimo.situacao === "falhou" || ultimo.situacao === "cancelado")) {
    return (
      <p role="alert" className="flex items-start gap-3 border border-wine-text/40 bg-wine-deep/30 p-4 text-sm text-ivory">
        <Icon name="alerta" className="mt-0.5 size-4.5 shrink-0 text-wine-text" />
        <span>
          A última atualização do site não deu certo ({plural} ainda não {pendentes === 1 ? "está" : "estão"} no ar). Uma nova tentativa acontece
          sozinha na próxima atualização automática; se continuar, avise o administrador do site.
        </span>
      </p>
    );
  }
  const andamento = ultimo && (ultimo.situacao === "disparado" || ultimo.situacao === "em_andamento");
  return (
    <p role="status" className="flex items-start gap-3 border border-gold/30 bg-gold/5 p-4 text-sm text-paper">
      <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 animate-pulse rounded-full bg-gold" />
      <span>
        {andamento ? "Atualizando o site" : "Atualização do site na fila"} ({plural}). Isso leva alguns minutos; esta lista mostra quando estiver no ar.
      </span>
    </p>
  );
}
const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function TelaInicio({ perfil, temMfa, aoCadastrarMfa, aoSair }: { perfil: Perfil; temMfa: boolean; aoCadastrarMfa: () => void; aoSair: () => void }) {
  const uid = useId();
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const [ciclo, setCiclo] = useState(0);
  const [editando, setEditando] = useState<string | "novo" | null>(null);
  const [usuarios, setUsuarios] = useState(false);
  const [busca, setBusca] = useState("");
  // Advogado começa vendo os próprios artigos; admin (sem assinatura) vê todos
  const [meus, setMeus] = useState(Boolean(perfil.integrante));
  const [status, setStatus] = useState<Status | "todos">("todos");
  const titulo = useRef<HTMLHeadingElement>(null);
  // Exclusão pela lixeira da lista
  const janelaExcluir = useRef<HTMLDialogElement>(null);
  const [excluindo, setExcluindo] = useState<Resumo | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  // Publicação direto da lista (rascunhos), com a mesma confirmação da OAB do editor
  const janelaPublicar = useRef<HTMLDialogElement>(null);
  const [publicando, setPublicando] = useState<LinhaArtigo | null>(null);
  const [conformidade, setConformidade] = useState(false);

  async function pedirPublicacao(a: Resumo) {
    setAviso(null);
    setOcupado(true);
    const { data, error } = await supabaseNavegador().from("artigos").select(COLUNAS).eq("id", a.id).single();
    setOcupado(false);
    if (error || !data) {
      setAviso({ tipo: "erro", texto: "Não foi possível abrir o artigo. Verifique a conexão e tente de novo." });
      return;
    }
    const linha = data as LinhaArtigo;
    const faltas = validar(formularioDe(linha), true);
    if (faltas.length) {
      const lista = faltas.slice(0, 3).map((f) => `${f.campo}: ${f.mensagem}`).join("; ");
      setAviso({ tipo: "erro", texto: `“${linha.titulo}” ainda não pode ser publicado (${lista}${faltas.length > 3 ? "…" : ""}). Clique em Editar para completar.` });
      return;
    }
    setPublicando(linha);
    setConformidade(false);
    janelaPublicar.current?.showModal();
  }

  async function confirmarPublicacao() {
    if (!publicando) return;
    setOcupado(true);
    const r = await salvar(supabaseNavegador(), { atual: publicando, form: formularioDe(publicando), status: "publicado", confirmouConformidade: true });
    setOcupado(false);
    janelaPublicar.current?.close();
    setAviso(r.erro ? { tipo: "erro", texto: r.erro } : { tipo: "ok", texto: `“${publicando.titulo}” foi publicado. O site é atualizado sozinho em alguns minutos.` });
    setPublicando(null);
    if (!r.erro) setRecarga((n) => n + 1);
  }

  function pedirExclusao(a: Resumo) {
    setExcluindo(a);
    setAviso(null);
    janelaExcluir.current?.showModal();
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    setOcupado(true);
    const erroExclusao = await excluir(supabaseNavegador(), excluindo.id);
    setOcupado(false);
    janelaExcluir.current?.close();
    setAviso(erroExclusao ? { tipo: "erro", texto: erroExclusao } : { tipo: "ok", texto: `“${excluindo.titulo}” foi excluído.` });
    setExcluindo(null);
    if (!erroExclusao) setRecarga((n) => n + 1);
  }

  useEffect(() => {
    if (!editando) titulo.current?.focus();
  }, [editando]);

  useEffect(() => {
    if (editando) return;
    const supabase = supabaseNavegador();
    let ativo = true;
    Promise.all([
      perfil.integrante ? supabase.from("integrantes").select("nome").eq("slug", perfil.integrante).maybeSingle() : Promise.resolve({ data: null, error: null }),
      supabase
        .from("artigos")
        .select("id, slug, titulo, resumo, area, status, revisao, revisao_no_ar, modificado_em, assinantes, criado_por")
        .order("modificado_em", { ascending: false }),
      supabase.from("pedidos_atualizacao").select("id", { count: "exact", head: true }).in("situacao", ["pendente", "disparado"]),
      supabase.from("deploys").select("situacao, concluido_em").order("id", { ascending: false }).limit(1),
      supabase.from("deploys").select("concluido_em").eq("situacao", "concluido").order("concluido_em", { ascending: false }).limit(1),
    ]).then(([integrante, artigos, pendentes, ultimo, concluido]) => {
      if (!ativo) return;
      if (artigos.error) {
        setErro(true);
        return;
      }
      setErro(false);
      setDados({
        nome: integrante.data?.nome ?? null,
        artigos: (artigos.data ?? []) as Resumo[],
        site: {
          pendentes: pendentes.count ?? 0,
          ultimo: (ultimo.data?.[0] as SituacaoSite["ultimo"]) ?? null,
          ultimaConclusao: concluido.data?.[0]?.concluido_em ?? null,
        },
      });
    });
    return () => {
      ativo = false;
    };
  }, [perfil.integrante, recarga, editando, ciclo]);

  // Recarrega sozinha enquanto houver alteração esperando o site
  const aguardando = (dados?.site.pendentes ?? 0) > 0;
  useEffect(() => {
    if (!aguardando || editando) return;
    const id = setInterval(() => setCiclo((n) => n + 1), INTERVALO_ATUALIZACAO);
    return () => clearInterval(id);
  }, [aguardando, editando]);

  if (usuarios) return <TelaUsuarios perfil={perfil} aoVoltar={() => setUsuarios(false)} />;

  if (editando) {
    return (
      <EditorArtigo
        id={editando === "novo" ? null : editando}
        perfil={perfil}
        aoVoltar={() => {
          setEditando(null);
          setRecarga((n) => n + 1);
        }}
      />
    );
  }

  const todos = dados?.artigos ?? [];
  const meusArtigos = todos.filter((a) => a.criado_por === perfil.userId || (!!perfil.integrante && a.assinantes.includes(perfil.integrante)));
  const base = meus ? meusArtigos : todos;
  const termo = semAcento(busca.trim());
  const visiveis = base.filter((a) => (status === "todos" || a.status === status) && (!termo || semAcento(`${a.titulo} ${a.resumo}`).includes(termo)));
  const contar = (s: Status | "todos") => base.filter((a) => s === "todos" || a.status === s).length;
  const opcoesStatus: (Status | "todos")[] = ["todos", "rascunho", "publicado", ...(contar("retirado") ? (["retirado"] as const) : [])];
  const nomeStatus = { todos: "Todos", rascunho: "Rascunhos", publicado: "Publicados", retirado: "Retirados" };

  return (
    <div className="space-y-8">
      {/* Topo */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h2 ref={titulo} tabIndex={-1} className="text-3xl focus:outline-none md:text-4xl">
            Olá{dados?.nome ? `, ${dados.nome}` : ""}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {perfil.email}
            {!temMfa && (
              <>
                {" · "}
                <button type="button" onClick={aoCadastrarMfa} className="text-gold underline-offset-4 hover:underline">
                  proteger a conta com verificação em duas etapas
                </button>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setEditando("novo")} className={buttonClasses("primary")}>
            + Escrever novo artigo
          </button>
          {perfil.papel === "admin" && (
            <button type="button" onClick={() => setUsuarios(true)} className={buttonClasses("outline")}>
              Usuários
            </button>
          )}
          <button type="button" onClick={aoSair} className={buttonClasses("ghost")}>
            Sair
          </button>
        </div>
      </div>

      {erro ? (
        <p role="alert" className="card p-6 text-sm text-ivory">
          Não foi possível carregar os artigos. Recarregue a página; se continuar, saia e entre de novo.
        </p>
      ) : !dados ? (
        <p className="text-sm text-muted" aria-live="polite">
          Carregando artigos…
        </p>
      ) : (
        <section aria-labelledby="lista-artigos" className="card p-6 md:p-8">
          <h2 id="lista-artigos" className="sr-only">
            Artigos
          </h2>
          <div className="mb-6">
            <AvisoSite site={dados.site} />
          </div>

          {/* Meus × todos */}
          {perfil.integrante && (
            <div role="tablist" aria-label="Quais artigos" className="mb-6 grid max-w-sm grid-cols-2 border border-white/10">
              {[
                [true, `Meus artigos (${meusArtigos.length})`],
                [false, `Todos (${todos.length})`],
              ].map(([valor, nome]) => (
                <button
                  key={String(valor)}
                  type="button"
                  role="tab"
                  aria-selected={meus === valor}
                  onClick={() => setMeus(valor as boolean)}
                  className={`py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition-colors ${meus === valor ? "bg-gold/15 text-gold" : "text-muted hover:text-ivory"}`}
                >
                  {nome as string}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div role="group" aria-label="Mostrar" className="flex flex-wrap gap-2">
              {opcoesStatus.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                  className={`border px-3.5 py-1.5 text-sm transition-colors ${status === s ? "border-gold bg-gold/10 text-gold" : "border-white/10 text-paper hover:border-gold/40"}`}
                >
                  {nomeStatus[s]} <span className="text-muted">{contar(s)}</span>
                </button>
              ))}
            </div>
            <div className="md:w-72">
              <label htmlFor={`${uid}-busca`} className="sr-only">
                Procurar artigo
              </label>
              <input
                id={`${uid}-busca`}
                type="search"
                placeholder="Procurar pelo título…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="block w-full rounded-[2px] border border-white/10 bg-ink/60 px-4 py-2.5 text-sm text-ivory placeholder:text-muted/70 hover:border-gold/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/60"
              />
            </div>
          </div>

          {visiveis.length === 0 ? (
            <div className="mt-8 border border-dashed border-white/15 p-8 text-center">
              <p className="text-paper">{base.length === 0 ? "Você ainda não tem artigos." : "Nenhum artigo encontrado."}</p>
              {base.length === 0 && (
                <button type="button" onClick={() => setEditando("novo")} className={`${buttonClasses("outline")} mt-5`}>
                  Escrever o primeiro
                </button>
              )}
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-white/5 border-y border-white/5">
              {visiveis.map((a) => (
                <li key={a.id} className="group/linha flex items-end md:items-center">
                  <button type="button" onClick={() => setEditando(a.id)} className="group flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3 py-4 text-left md:flex-nowrap">
                    <span className="min-w-0 basis-full md:flex-1 md:basis-auto">
                      <span className="block font-serif text-lg leading-snug text-ivory transition-colors group-hover:text-gold">{a.titulo}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {getArea(a.area)?.nomeCurto ?? a.area} · alterado em {dataCurta(a.modificado_em)} ·{" "}
                        <span className={tomSite[noSite(a).tom]}>{noSite(a).texto.toLowerCase()}</span>
                        {!podeEditar(a, perfil) && " · só leitura"}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center">
                      <span className={`${pilula} ${selo[a.status]}`}>{statusCms[a.status]}</span>
                      {/* "Gaveta" do botão: fechada no computador até passar o mouse (ou chegar pelo teclado), empurrando o selo
                          para o lado; no celular fica sempre aberta */}
                      <span className="flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 ease-out md:max-w-0 md:opacity-0 md:group-hover/linha:max-w-32 md:group-hover/linha:opacity-100 md:group-focus-within/linha:max-w-32 md:group-focus-within/linha:opacity-100">
                        <span className={`${pilula} ml-2 border-gold/45 text-ivory transition-colors group-hover:border-gold group-hover:bg-gold/10`}>
                          {podeEditar(a, perfil) ? "Editar" : "Ver"}
                          <Icon name="seta" className="size-3.5 text-gold" />
                        </span>
                      </span>
                    </span>
                  </button>
                  {/* Publicar: só rascunhos de quem pode editar; abre junto com o "Editar" */}
                  {a.status === "rascunho" && podeEditar(a, perfil) && (
                    <span className="flex items-center overflow-hidden pb-4 md:self-stretch transition-all duration-300 ease-out md:max-w-0 md:pb-0 md:opacity-0 md:group-hover/linha:max-w-32 md:group-hover/linha:opacity-100 md:group-focus-within/linha:max-w-32 md:group-focus-within/linha:opacity-100">
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() => void pedirPublicacao(a)}
                        aria-label={`Publicar “${a.titulo}”`}
                        className={`${pilula} ml-2 cursor-pointer !gap-1 !px-1.5 border-gold bg-gradient-to-b from-[#e3c27a] to-gold text-coal shadow-[0_2px_0_rgba(0,0,0,0.45),0_6px_14px_-6px_rgba(201,162,90,0.7)] transition-all duration-150 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_3px_0_rgba(0,0,0,0.45),0_10px_18px_-6px_rgba(201,162,90,0.85)] active:translate-y-px active:shadow-[0_0_0_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory/80 disabled:cursor-wait disabled:opacity-60`}
                      >
                        <Icon name="seta" className="size-3 -rotate-45" />
                        Publicar
                      </button>
                    </span>
                  )}
                  {/* Lixeira: abre junto com o "Editar"; só para quem pode excluir (regras do banco) */}
                  {podeExcluir(a, perfil) && (
                    <span className="flex items-center overflow-hidden pb-4 md:self-stretch transition-all duration-300 ease-out md:max-w-0 md:pb-0 md:opacity-0 md:group-hover/linha:max-w-32 md:group-hover/linha:opacity-100 md:group-focus-within/linha:max-w-32 md:group-focus-within/linha:opacity-100">
                      <button
                        type="button"
                        onClick={() => pedirExclusao(a)}
                        aria-label={`Excluir “${a.titulo}”`}
                        className="ml-2 grid size-7 place-items-center border border-wine-text/40 text-wine-text transition-colors hover:border-wine-text hover:bg-wine-deep/50 focus-visible:border-wine-text"
                      >
                        <Icon name="lixeira" className="size-4" />
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted">Ao publicar, editar, retirar ou excluir, o site é atualizado sozinho em alguns minutos.</p>
        </section>
      )}

      {aviso && (
        <p
          role={aviso.tipo === "erro" ? "alert" : "status"}
          className={`flex items-start gap-3 border p-4 text-sm text-ivory ${aviso.tipo === "erro" ? "border-wine-text/40 bg-wine-deep/30" : "border-gold/40 bg-gold/10"}`}
        >
          <Icon name={aviso.tipo === "erro" ? "alerta" : "check"} className={`mt-0.5 size-4.5 shrink-0 ${aviso.tipo === "erro" ? "text-wine-text" : "text-gold"}`} />
          {aviso.texto}
        </p>
      )}

      {/* Confirmação de publicação pela lista (regras de publicidade da OAB) */}
      <dialog
        ref={janelaPublicar}
        aria-labelledby={`${uid}-publicar`}
        onClick={(e) => e.target === e.currentTarget && janelaPublicar.current?.close()}
        onClose={() => setPublicando(null)}
        className="m-auto w-[min(100%-2rem,32rem)] border border-gold/20 bg-coal p-0 text-paper shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      >
        {publicando && (
          <div className="p-6 md:p-8">
            <h2 id={`${uid}-publicar`} className="text-2xl">
              Publicar o artigo?
            </h2>
            <p className="mt-4 font-serif text-lg text-ivory">“{publicando.titulo}”</p>
            <label className="mt-5 flex items-start gap-3 text-sm text-paper">
              <input type="checkbox" checked={conformidade} onChange={(e) => setConformidade(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--color-gold)]" />
              <span>
                Revisei o texto: ele é informativo, não promete resultado e segue as regras de publicidade da advocacia (Provimento OAB nº 205/2021).
              </span>
            </label>
            <p className="mt-4 text-xs text-muted">Depois de confirmar, o site é atualizado sozinho em alguns minutos.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" disabled={!conformidade || ocupado} onClick={() => void confirmarPublicacao()} className={buttonClasses("primary")}>
                {ocupado ? "Publicando…" : "Publicar"}
              </button>
              <button type="button" onClick={() => janelaPublicar.current?.close()} className={buttonClasses("ghost")}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </dialog>

      {/* Confirmação de exclusão */}
      <dialog
        ref={janelaExcluir}
        aria-labelledby={`${uid}-excluir`}
        onClick={(e) => e.target === e.currentTarget && janelaExcluir.current?.close()}
        onClose={() => setExcluindo(null)}
        className="m-auto w-[min(100%-2rem,30rem)] border border-wine-text/30 bg-coal p-0 text-paper shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      >
        {excluindo && (
          <div className="p-6 md:p-8">
            <h2 id={`${uid}-excluir`} className="flex items-center gap-3 text-2xl">
              <Icon name="lixeira" className="size-6 text-wine-text" />
              Excluir artigo?
            </h2>
            <p className="mt-4 font-serif text-lg text-ivory">“{excluindo.titulo}”</p>
            <p className="mt-3 text-sm text-paper">
              {excluindo.status === "rascunho" && excluindo.revisao_no_ar === null
                ? "Este rascunho será apagado."
                : "Este artigo será apagado do painel agora e sairá do site em alguns minutos."}{" "}
              <strong className="text-ivory">Não é possível desfazer.</strong>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={ocupado}
                onClick={confirmarExclusao}
                className="inline-flex items-center gap-2 border border-wine-text/60 bg-wine-deep px-5 py-3 text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-wine disabled:opacity-60"
              >
                <Icon name="lixeira" className="size-4" />
                {ocupado ? "Excluindo…" : "Excluir"}
              </button>
              <button type="button" onClick={() => janelaExcluir.current?.close()} className={buttonClasses("ghost")}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
