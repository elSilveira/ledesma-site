"use client";

import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { DIAS_LEMBRAR, lembrarEsteComputador, supabaseNavegador } from "@/lib/supabase/cliente";
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
      <p className="mt-6 text-xs text-muted">Esqueceu a senha? Peça ao administrador do site uma senha temporária nova.</p>
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
  const [lembrar, setLembrar] = useState(false);

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
    if (lembrar) lembrarEsteComputador();
    await aoConcluir();
  }

  return (
    <Cartao eyebrow="Verificação em duas etapas" titulo="Digite o código do aplicativo">
      <p className="mt-3 text-sm text-muted">Abra o aplicativo autenticador e digite o código atual de “Ledesma Advocacia CMS”.</p>
      <form onSubmit={enviar}>
        <CampoCodigo id={`${uid}-codigo`} valor={codigo} aoMudar={setCodigo} />
        <label className="mt-5 flex items-start gap-3 text-sm text-paper">
          <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--color-gold)]" />
          <span>
            Lembrar este computador por {DIAS_LEMBRAR} dias
            <span className="mt-0.5 block text-xs text-muted">Você continua conectado mesmo fechando o navegador. Não use em computador compartilhado.</span>
          </span>
        </label>
        <Erro texto={erro} />
        <button type="submit" disabled={enviando || codigo.length !== 6} className={`${buttonClasses("primary")} mt-6 w-full`}>
          {enviando ? "Confirmando…" : "Confirmar"}
        </button>
      </form>
      <BotaoSair aoSair={aoSair} />
    </Cartao>
  );
}

/** Primeiro acesso (ou senha temporária reenviada): a pessoa define a própria senha. */
export function TelaTrocarSenha({ email, aoConcluir, aoSair }: { email: string; aoConcluir: () => Promise<void>; aoSair: () => void }) {
  const uid = useId();
  const [senha, setSenha] = useState("");
  const [repetir, setRepetir] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const problema =
    senha.length > 0 && senha.length < 10
      ? "Use pelo menos 10 caracteres."
      : repetir.length > 0 && senha !== repetir
        ? "As duas senhas não são iguais."
        : null;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (problema || senha.length < 10) return;
    setErro(null);
    setEnviando(true);
    const supabase = supabaseNavegador();
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setErro(traduzirErro(error, "senha"));
      setEnviando(false);
      return;
    }
    await supabase.rpc("concluir_troca_senha");
    setSenha("");
    setRepetir("");
    await aoConcluir();
  }

  return (
    <Cartao eyebrow="Primeiro acesso" titulo="Crie a sua senha">
      <p className="mt-3 text-sm text-muted">
        Você entrou com uma senha temporária. Defina agora uma senha só sua para <span className="text-paper">{email}</span>; a temporária deixa de valer.
      </p>
      <form onSubmit={enviar} className="mt-6 space-y-5">
        {/* Campo oculto com o e-mail: ajuda o gerenciador de senhas a salvar a senha nova na conta certa */}
        <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />
        <div>
          <label htmlFor={`${uid}-nova`} className="text-sm text-paper">
            Senha nova (mínimo 10 caracteres)
          </label>
          <input id={`${uid}-nova`} type="password" autoComplete="new-password" required minLength={10} value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor={`${uid}-repetir`} className="text-sm text-paper">
            Repita a senha nova
          </label>
          <input id={`${uid}-repetir`} type="password" autoComplete="new-password" required value={repetir} onChange={(e) => setRepetir(e.target.value)} className={campo} />
        </div>
        {problema && <p className="text-sm text-wine-text">{problema}</p>}
        <Erro texto={erro} />
        <button type="submit" disabled={enviando || !!problema || senha.length < 10 || senha !== repetir} className={`${buttonClasses("primary")} w-full`}>
          {enviando ? "Salvando…" : "Salvar senha e continuar"}
        </button>
      </form>
      <p className="mt-5 text-xs text-muted">Em seguida você cadastra a verificação em duas etapas no celular.</p>
      <BotaoSair aoSair={aoSair} />
    </Cartao>
  );
}

type Cadastro = { factorId: string; qr: string; chave: string };

/** Cadastro do MFA por aplicativo (TOTP). Obrigatório para todas as contas. */
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
          ? "Todas as contas do painel usam a verificação em duas etapas: além da senha, um código do celular. Leva um minuto."
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

