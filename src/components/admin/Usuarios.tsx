"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabaseNavegador } from "@/lib/supabase/cliente";
import { buttonClasses } from "../Button";
import { Icon } from "../icons";
import type { Papel, Perfil } from "./sessao";

type Usuario = {
  user_id: string;
  email: string;
  papel: Papel;
  integrante: string | null;
  ativo: boolean;
  criado_em: string;
  ultimo_acesso: string | null;
  trocar_senha: boolean;
  tem_mfa: boolean;
};
type Integrante = { slug: string; nome: string };
type Aviso = { tipo: "ok" | "erro"; texto: string } | null;
type Acao = { tipo: "nova_senha" | "zerar_mfa" | "desativar" | "reativar"; usuario: Usuario };

const campo =
  "mt-2 block w-full rounded-[2px] border border-white/10 bg-ink/60 px-4 py-3 text-[0.95rem] text-ivory placeholder:text-muted/70 transition-colors duration-300 hover:border-gold/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/60";
const etiqueta = "inline-flex h-6 items-center border px-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em]";
const dataCurta = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Chama a Edge Function e devolve a mensagem (de sucesso ou de erro) em português. */
async function chamarFuncao(corpo: Record<string, unknown>): Promise<{ ok: boolean; texto: string }> {
  const { data, error } = await supabaseNavegador().functions.invoke("gerenciar-usuarios", { body: corpo });
  if (!error) return { ok: true, texto: (data as { mensagem?: string })?.mensagem ?? "Pronto." };
  if (error instanceof FunctionsHttpError) {
    try {
      const r = (await error.context.json()) as { erro?: string };
      if (r.erro) return { ok: false, texto: r.erro.charAt(0).toUpperCase() + r.erro.slice(1) + "." };
    } catch {
      // resposta sem JSON
    }
  }
  return { ok: false, texto: "Não foi possível falar com o servidor. Verifique a conexão e tente de novo." };
}

const textoAcao = {
  nova_senha: {
    titulo: "Enviar nova senha temporária?",
    texto: "A senha atual deixa de valer. A pessoa recebe uma senha temporária por e-mail e cria outra no próximo acesso.",
    botao: "Enviar senha",
  },
  zerar_mfa: {
    titulo: "Remover a verificação em duas etapas?",
    texto: "Use quando a pessoa perdeu ou trocou o celular. No próximo acesso ela cadastra o aplicativo autenticador de novo.",
    botao: "Remover",
  },
  desativar: {
    titulo: "Desativar o acesso?",
    texto: "A pessoa deixa de ver e alterar os artigos no painel. Os artigos dela continuam no site. Dá para reativar depois.",
    botao: "Desativar",
  },
  reativar: { titulo: "Reativar o acesso?", texto: "A pessoa volta a usar o painel com a mesma conta.", botao: "Reativar" },
};

/** Área "Usuários" (só admin): cadastrar contas e controlar o acesso. O banco e a Edge Function conferem tudo de novo. */
export function TelaUsuarios({ perfil, aoVoltar }: { perfil: Perfil; aoVoltar: () => void }) {
  const uid = useId();
  const titulo = useRef<HTMLHeadingElement>(null);
  const janela = useRef<HTMLDialogElement>(null);
  const [lista, setLista] = useState<Usuario[] | null>(null);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [erroLista, setErroLista] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Formulário de cadastro
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("advogado");
  const [integrante, setIntegrante] = useState("");

  useEffect(() => titulo.current?.focus(), []);

  useEffect(() => {
    const supabase = supabaseNavegador();
    let ativo = true;
    Promise.all([supabase.rpc("listar_autorizacoes"), supabase.from("integrantes").select("slug, nome").eq("ativo", true).order("nome")]).then(([u, i]) => {
      if (!ativo) return;
      if (u.error) {
        setErroLista(true);
        return;
      }
      setErroLista(false);
      setLista(u.data as Usuario[]);
      setIntegrantes((i.data ?? []) as Integrante[]);
    });
    return () => {
      ativo = false;
    };
  }, [recarga]);

  const nomeDe = (slug: string | null) => integrantes.find((i) => i.slug === slug)?.nome ?? slug;

  async function cadastrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAviso(null);
    setOcupado(true);
    const r = await chamarFuncao({ acao: "criar", email: email.trim(), papel, integrante: integrante || null });
    setOcupado(false);
    setAviso({ tipo: r.ok ? "ok" : "erro", texto: r.texto });
    if (r.ok) {
      setEmail("");
      setIntegrante("");
      setPapel("advogado");
      setRecarga((n) => n + 1);
    }
  }

  function pedir(tipo: Acao["tipo"], usuario: Usuario) {
    setAviso(null);
    setAcao({ tipo, usuario });
    janela.current?.showModal();
  }

  async function confirmar() {
    if (!acao) return;
    setOcupado(true);
    const { tipo, usuario } = acao;
    let r: { ok: boolean; texto: string };
    if (tipo === "desativar" || tipo === "reativar") {
      const { error } = await supabaseNavegador().rpc("autorizar_usuario", {
        p_email: usuario.email,
        p_papel: usuario.papel,
        p_integrante: usuario.integrante,
        p_ativo: tipo === "reativar",
      });
      r = error
        ? { ok: false, texto: /último administrador/.test(error.message) ? "Não é possível desativar o último administrador ativo." : "Não foi possível alterar o acesso." }
        : { ok: true, texto: tipo === "reativar" ? `Acesso de ${usuario.email} reativado.` : `Acesso de ${usuario.email} desativado.` };
    } else {
      r = await chamarFuncao({ acao: tipo, user_id: usuario.user_id });
    }
    setOcupado(false);
    janela.current?.close();
    setAcao(null);
    setAviso({ tipo: r.ok ? "ok" : "erro", texto: r.texto });
    if (r.ok) setRecarga((n) => n + 1);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <button type="button" onClick={aoVoltar} className="inline-flex items-center gap-2 text-sm text-gold hover:text-ivory">
            <Icon name="seta" className="size-3.5 rotate-180" /> Voltar aos artigos
          </button>
          <h2 ref={titulo} tabIndex={-1} className="mt-4 text-3xl focus:outline-none md:text-4xl">
            Usuários
          </h2>
          <p className="mt-2 text-sm text-muted">Quem pode entrar no painel. Contas novas recebem uma senha temporária por e-mail.</p>
        </div>
      </div>

      {/* Cadastro */}
      <section aria-labelledby={`${uid}-novo`} className="card p-6 md:p-8">
        <h3 id={`${uid}-novo`} className="text-xl">
          Adicionar usuário
        </h3>
        <form onSubmit={cadastrar} className="mt-5 grid gap-5 md:grid-cols-[2fr_1fr_1.4fr_auto] md:items-end">
          <div>
            <label htmlFor={`${uid}-email`} className="text-sm text-paper">
              E-mail
            </label>
            <input id={`${uid}-email`} type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className={campo} />
          </div>
          <div>
            <label htmlFor={`${uid}-papel`} className="text-sm text-paper">
              Papel
            </label>
            <select id={`${uid}-papel`} value={papel} onChange={(e) => setPapel(e.target.value as Papel)} className={campo}>
              <option value="advogado">Advogado</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${uid}-integrante`} className="text-sm text-paper">
              Advogado no site {papel === "admin" && <span className="text-muted">(opcional)</span>}
            </label>
            <select id={`${uid}-integrante`} required={papel === "advogado"} value={integrante} onChange={(e) => setIntegrante(e.target.value)} className={campo}>
              <option value="">{papel === "admin" ? "Nenhum" : "Escolha…"}</option>
              {integrantes.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.nome}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={ocupado} className={buttonClasses("primary")}>
            {ocupado && !acao ? "Cadastrando…" : "Cadastrar"}
          </button>
        </form>
        <p className="mt-4 text-xs text-muted">
          {papel === "admin"
            ? "Administrador: gerencia usuários e edita qualquer artigo."
            : "Advogado: escreve artigos e edita os que criou ou assina."}{" "}
          No primeiro acesso a pessoa cria a própria senha e cadastra a verificação em duas etapas.
        </p>
      </section>

      {aviso && (
        <p
          role={aviso.tipo === "erro" ? "alert" : "status"}
          className={`flex items-start gap-3 border p-4 text-sm text-ivory ${aviso.tipo === "erro" ? "border-wine-text/40 bg-wine-deep/30" : "border-gold/40 bg-gold/10"}`}
        >
          <Icon name={aviso.tipo === "erro" ? "alerta" : "check"} className={`mt-0.5 size-4.5 shrink-0 ${aviso.tipo === "erro" ? "text-wine-text" : "text-gold"}`} />
          {aviso.texto}
        </p>
      )}

      {/* Lista */}
      <section aria-labelledby={`${uid}-lista`} className="card p-6 md:p-8">
        <h3 id={`${uid}-lista`} className="text-xl">
          Contas
        </h3>
        {erroLista ? (
          <p role="alert" className="mt-5 text-sm text-wine-text">
            Não foi possível carregar os usuários. Saia e entre de novo.
          </p>
        ) : !lista ? (
          <p className="mt-5 text-sm text-muted" aria-live="polite">
            Carregando…
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-white/5 border-y border-white/5">
            {lista.map((u) => {
              const eu = u.user_id === perfil.userId;
              return (
                <li key={u.user_id} className={`flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between ${u.ativo ? "" : "opacity-60"}`}>
                  <div className="min-w-0">
                    <p className="truncate text-ivory">
                      {u.email}
                      {eu && <span className="text-muted"> (você)</span>}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {u.papel === "admin" ? "Administrador" : "Advogado"}
                      {u.integrante && ` · ${nomeDe(u.integrante)}`} · {u.ultimo_acesso ? `último acesso em ${dataCurta(u.ultimo_acesso)}` : "nunca entrou"}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-2">
                      {!u.ativo && <span className={`${etiqueta} border-wine-text/50 text-wine-text`}>Desativado</span>}
                      {u.trocar_senha && <span className={`${etiqueta} border-white/20 text-paper`}>Senha temporária</span>}
                      <span className={`${etiqueta} ${u.tem_mfa ? "border-gold/50 text-gold" : "border-white/20 text-muted"}`}>
                        {u.tem_mfa ? "Duas etapas ativas" : "Duas etapas pendente"}
                      </span>
                    </p>
                  </div>
                  {!eu && (
                    <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-2 text-sm">
                      {u.ativo && (
                        <>
                          <button type="button" onClick={() => pedir("nova_senha", u)} className="text-gold hover:text-ivory">
                            Enviar nova senha
                          </button>
                          {u.tem_mfa && (
                            <button type="button" onClick={() => pedir("zerar_mfa", u)} className="text-gold hover:text-ivory">
                              Remover duas etapas
                            </button>
                          )}
                        </>
                      )}
                      <button type="button" onClick={() => pedir(u.ativo ? "desativar" : "reativar", u)} className={u.ativo ? "text-wine-text hover:text-ivory" : "text-gold hover:text-ivory"}>
                        {u.ativo ? "Desativar" : "Reativar"}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <dialog
        ref={janela}
        aria-labelledby={`${uid}-acao`}
        onClick={(e) => e.target === e.currentTarget && janela.current?.close()}
        onClose={() => setAcao(null)}
        className="m-auto w-[min(100%-2rem,30rem)] border border-gold/20 bg-coal p-0 text-paper shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      >
        {acao && (
          <div className="p-6 md:p-8">
            <h2 id={`${uid}-acao`} className="text-2xl">
              {textoAcao[acao.tipo].titulo}
            </h2>
            <p className="mt-4 text-ivory">{acao.usuario.email}</p>
            <p className="mt-3 text-sm text-paper">{textoAcao[acao.tipo].texto}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" disabled={ocupado} onClick={() => void confirmar()} className={buttonClasses("primary")}>
                {ocupado ? "Aguarde…" : textoAcao[acao.tipo].botao}
              </button>
              <button type="button" onClick={() => janela.current?.close()} className={buttonClasses("ghost")}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
