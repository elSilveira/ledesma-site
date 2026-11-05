"use client";

import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/cliente";
import { buttonClasses } from "../Button";
import { Icon } from "../icons";
import { traduzirErro } from "./sessao";

// Mesmo estilo dos campos do formulário de contato
const campo =
  "mt-2 block w-full rounded-[2px] border border-white/10 bg-ink/60 px-4 py-3.5 text-[0.95rem] text-ivory placeholder:text-muted/70 transition-colors duration-300 hover:border-gold/30 focus:border-gold focus:outline-none focus-visible:outline-none focus:ring-1 focus:ring-gold/60";

/** Cartão das telas de acesso; o título recebe o foco ao trocar de tela (leitores de tela anunciam a mudança). */
export function Cartao({ eyebrow, titulo, children, largo = false }: { eyebrow: string; titulo: string; children: ReactNode; largo?: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className={`card p-7 md:p-10 ${largo ? "max-w-2xl" : "max-w-md"}`}>
      <p className="eyebrow !text-[0.66rem]">{eyebrow}</p>
      <h2 ref={ref} tabIndex={-1} className="mt-4 text-2xl focus:outline-none md:text-3xl">
        {titulo}
      </h2>
      {children}
    </div>
  );
}

function Erro({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <p role="alert" className="mt-5 flex items-start gap-2 border border-wine-text/40 bg-wine-deep/30 p-3.5 text-sm text-ivory">
      <Icon name="alerta" className="mt-0.5 size-4 shrink-0 text-wine-text" /> {texto}
    </p>
  );
}

function BotaoSair({ aoSair }: { aoSair: () => void }) {
  return (
    <button type="button" onClick={aoSair} className={`${buttonClasses("ghost")} mt-6`}>
      Sair
    </button>
  );
}

function CampoCodigo({ id, valor, aoMudar }: { id: string; valor: string; aoMudar: (v: string) => void }) {
  return (
    <div className="mt-6">
      <label htmlFor={id} className="text-sm text-paper">
        Código de 6 dígitos
      </label>
      <input
        id={id}
        name="codigo"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        value={valor}
        onChange={(e) => aoMudar(e.target.value.replace(/\D/g, ""))}
        className={`${campo} text-center font-mono text-xl tracking-[0.5em]`}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function TelaLogin({ aoEntrar }: { aoEntrar: () => Promise<void> }) {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabaseNavegador().auth.signInWithPassword({ email: email.trim(), password: senha });
    setSenha("");
    if (error) {
      setErro(traduzirErro(error, "login"));
      setEnviando(false);
      return;
    }
    await aoEntrar();
  }

  return (
    <Cartao eyebrow="Acesso restrito" titulo="Entrar no painel">
      <p className="mt-3 text-sm text-muted">Somente advogados autorizados pelo escritório. Não há cadastro aberto: o acesso é feito por convite.</p>
      <form onSubmit={enviar} className="mt-6 space-y-5">
        <div>
          <label htmlFor={`${uid}-email`} className="text-sm text-paper">
            E-mail
          </label>
          <input id={`${uid}-email`} type="email" name="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor={`${uid}-senha`} className="text-sm text-paper">
            Senha
          </label>
          <input id={`${uid}-senha`} type="password" name="senha" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} />
        </div>
        <Erro texto={erro} />
        <button type="submit" disabled={enviando} className={`${buttonClasses("primary")} w-full`}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="mt-6 text-xs text-muted">Esqueceu a senha? Fale com o administrador do site.</p>
    </Cartao>
  );
}

export function TelaSemAutorizacao({ email, aoSair }: { email: string; aoSair: () => void }) {
  return (
    <Cartao eyebrow="Acesso restrito" titulo="Conta sem autorização">
      <p className="mt-4 text-paper">
        A conta <strong className="text-ivory">{email}</strong> entrou, mas não está autorizada a usar o painel ou foi desativada.
      </p>
      <p className="mt-3 text-sm text-muted">Peça ao administrador do site para liberar o seu acesso.</p>
      <BotaoSair aoSair={aoSair} />
    </Cartao>
  );
}

export function TelaVerificarMfa({ factorId, aoConcluir, aoSair }: { factorId: string; aoConcluir: () => Promise<void>; aoSair: () => void }) {
  const uid = useId();
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabaseNavegador().auth.mfa.challengeAndVerify({ factorId, code: codigo });
    setCodigo("");
    if (error) {
      setErro(traduzirErro(error, "codigo"));
      setEnviando(false);
      return;
    }
    await aoConcluir();
  }

  return (
    <Cartao eyebrow="Verificação em duas etapas" titulo="Digite o código do aplicativo">
      <p className="mt-3 text-sm text-muted">Abra o aplicativo autenticador e digite o código atual de “Ledesma Advocacia CMS”.</p>
      <form onSubmit={enviar}>
        <CampoCodigo id={`${uid}-codigo`} valor={codigo} aoMudar={setCodigo} />
        <Erro texto={erro} />
        <button type="submit" disabled={enviando || codigo.length !== 6} className={`${buttonClasses("primary")} mt-6 w-full`}>
          {enviando ? "Confirmando…" : "Confirmar"}
        </button>
      </form>
      <BotaoSair aoSair={aoSair} />
    </Cartao>
  );
}

type Cadastro = { factorId: string; qr: string; chave: string };

/** Cadastro do MFA por aplicativo (TOTP). Obrigatório para admin; opcional para advogado. */
export function TelaCadastrarMfa({
  obrigatorio,
  aoConcluir,
  aoCancelar,
  aoSair,
}: {
  obrigatorio: boolean;
  aoConcluir: () => Promise<void>;
  aoCancelar: () => void;
  aoSair: () => void;
}) {
  const uid = useId();
  const [cadastro, setCadastro] = useState<Cadastro | null>(null);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Só cria o fator quando a pessoa pede (evita fatores órfãos a cada abertura da tela)
  async function gerar() {
    setErro(null);
    setOcupado(true);
    const mfa = supabaseNavegador().auth.mfa;
    const fatores = await mfa.listFactors();
    for (const f of fatores.data?.all ?? []) {
      if (f.factor_type === "totp" && f.status !== "verified") await mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await mfa.enroll({ factorType: "totp", issuer: "Ledesma Advocacia CMS", friendlyName: "Aplicativo autenticador" });
    setOcupado(false);
    if (error || !data) {
      setErro("Não foi possível gerar o QR code. Confira se o MFA por aplicativo está ativo no Supabase e tente de novo.");
      return;
    }
    setCadastro({ factorId: data.id, qr: data.totp.qr_code, chave: data.totp.secret.match(/.{1,4}/g)?.join(" ") ?? data.totp.secret });
  }

  async function confirmar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cadastro) return;
    setErro(null);
    setOcupado(true);
    const { error } = await supabaseNavegador().auth.mfa.challengeAndVerify({ factorId: cadastro.factorId, code: codigo });
    setCodigo("");
    if (error) {
      setErro(traduzirErro(error, "codigo"));
      setOcupado(false);
      return;
    }
    await aoConcluir();
  }

  async function cancelar() {
    if (cadastro) await supabaseNavegador().auth.mfa.unenroll({ factorId: cadastro.factorId });
    aoCancelar();
  }

  return (
    <Cartao eyebrow="Verificação em duas etapas" titulo="Cadastrar o aplicativo autenticador" largo>
      <p className="mt-3 text-sm text-muted">
        {obrigatorio
          ? "Contas de administrador precisam da verificação em duas etapas. Sem ela, o painel não libera nenhum dado."
          : "Opcional, mas recomendado: protege a conta mesmo se a senha vazar."}
      </p>

      {!cadastro ? (
        <ol className="mt-6 space-y-2 text-sm text-paper">
          <li>1. Instale um aplicativo autenticador no celular (Google Authenticator, Microsoft Authenticator, 1Password…).</li>
          <li>2. Gere o QR code abaixo e leia com o aplicativo.</li>
          <li>3. Digite o código de 6 dígitos que aparecer.</li>
        </ol>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
          {/* QR em data URI gerado pelo Supabase: next/image não se aplica */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cadastro.qr} alt="QR code para cadastrar a conta no aplicativo autenticador" width={176} height={176} className="size-44 bg-white p-2" />
          <div className="text-sm text-paper">
            <p>Leia o QR code com o aplicativo. Se preferir, escolha “inserir chave” e digite:</p>
            <p className="mt-3 select-all break-all border border-white/10 bg-ink/60 px-3 py-2.5 font-mono text-ivory">{cadastro.chave}</p>
            <p className="mt-3 text-xs text-muted">Não copie essa chave para conversas, e-mails ou arquivos: ela fica só no aplicativo.</p>
          </div>
        </div>
      )}

      <Erro texto={erro} />

      {!cadastro ? (
        <button type="button" onClick={gerar} disabled={ocupado} className={`${buttonClasses("primary")} mt-6`}>
          <Icon name="escudo" className="size-4.5 shrink-0" />
          <span>{ocupado ? "Gerando…" : "Gerar QR code"}</span>
        </button>
      ) : (
        <form onSubmit={confirmar} className="max-w-xs">
          <CampoCodigo id={`${uid}-codigo`} valor={codigo} aoMudar={setCodigo} />
          <button type="submit" disabled={ocupado || codigo.length !== 6} className={`${buttonClasses("primary")} mt-6 w-full`}>
            {ocupado ? "Confirmando…" : "Confirmar e ativar"}
          </button>
        </form>
      )}

      <div className="mt-6 flex flex-wrap gap-6">
        {!obrigatorio && (
          <button type="button" onClick={cancelar} className={buttonClasses("ghost")}>
            Agora não
          </button>
        )}
        <button type="button" onClick={aoSair} className={buttonClasses("ghost")}>
          Sair
        </button>
      </div>
    </Cartao>
  );
}

