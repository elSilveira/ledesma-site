"use client";

import Link from "next/link";
import { type FormEvent, useId, useRef, useState } from "react";
import { type AreaSlug, equipe, linkWhatsApp } from "@/config/site";
import { areas } from "@/content/areas";
import { buttonClasses } from "./Button";
import { Icon } from "./icons";

/**
 * Formulário de contato.
 * O escritório ainda não possui e-mail ou servidor de envio configurado. Por isso, o formulário
 * valida os dados e abre o WhatsApp do(a) advogado(a) da área escolhida com a mensagem pronta:
 * nada é armazenado pelo site e o envio só ocorre quando a pessoa confirma no WhatsApp.
 */

type Campos = { nome: string; telefone: string; email: string; cidade: string; area: AreaSlug | ""; mensagem: string; consentimento: boolean };
type Erros = Partial<Record<keyof Campos, string>>;

const vazio: Campos = { nome: "", telefone: "", email: "", cidade: "", area: "", mensagem: "", consentimento: false };

const rotulos: Record<keyof Campos, string> = {
  nome: "Nome completo",
  telefone: "Telefone / WhatsApp",
  email: "E-mail",
  cidade: "Cidade",
  area: "Área do assunto",
  mensagem: "Mensagem",
  consentimento: "Consentimento",
};

export function validar(c: Campos): Erros {
  const e: Erros = {};
  const nome = c.nome.trim();
  if (!nome) e.nome = "Informe seu nome.";
  else if (nome.length < 3 || !/\s/.test(nome)) e.nome = "Informe nome e sobrenome.";

  const digitos = c.telefone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (!digitos) e.telefone = "Informe um telefone para retorno.";
  else if (digitos.length < 10 || digitos.length > 11) e.telefone = "Informe o telefone com DDD, por exemplo (45) 9 9999-9999.";

  if (c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = "Informe um e-mail válido ou deixe o campo em branco.";

  if (!c.area) e.area = "Escolha a área mais próxima do seu assunto.";

  const msg = c.mensagem.trim();
  if (!msg) e.mensagem = "Descreva brevemente o assunto.";
  else if (msg.length < 20) e.mensagem = "Escreva ao menos 20 caracteres para que possamos entender o assunto.";
  else if (msg.length > 1500) e.mensagem = "A mensagem deve ter no máximo 1.500 caracteres.";

  if (!c.consentimento) e.consentimento = "É necessário concordar com o uso dos dados para o retorno do contato.";
  return e;
}

export function ContactForm() {
  const uid = useId();
  const [campos, setCampos] = useState<Campos>(vazio);
  const [erros, setErros] = useState<Erros>({});
  const [enviado, setEnviado] = useState<{ href: string; nome: string } | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const resumoRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const id = (k: keyof Campos) => `${uid}-${k}`;

  function set<K extends keyof Campos>(k: K, v: Campos[K]) {
    setCampos((c) => ({ ...c, [k]: v }));
    // Revalida o campo após a primeira tentativa de envio
    if (erros[k]) setErros((prev) => ({ ...prev, [k]: validar({ ...campos, [k]: v })[k] }));
  }

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setFalha(null);
    const e = validar(campos);
    setErros(e);
    if (Object.keys(e).length) {
      setEnviado(null);
      requestAnimationFrame(() => resumoRef.current?.focus());
      return;
    }

    const responsavel = equipe.find((p) => p.area === campos.area);
    const area = areas.find((a) => a.slug === campos.area);
    const href = responsavel && area ? linkWhatsApp(responsavel, montarMensagem(campos, area.nome, responsavel.nomeCurto)) : null;
    if (!href || !responsavel) {
      setFalha("Não foi possível preparar a mensagem para esta área. Utilize os contatos diretos ao lado.");
      return;
    }

    // Se o navegador bloquear a nova janela, a mensagem de status oferece o link para abrir manualmente.
    window.open(href, "_blank", "noopener,noreferrer");
    setEnviado({ href, nome: responsavel.nomeCurto });
    setCampos(vazio);
    setErros({});
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  const listaErros = Object.entries(erros).filter(([, v]) => v) as [keyof Campos, string][];

  const campoBase =
    "mt-2 block w-full rounded-[2px] border bg-ink/60 px-4 py-3.5 text-[0.95rem] text-ivory placeholder:text-muted/70 transition-colors duration-300 focus:border-gold focus:outline-none focus-visible:outline-none focus:ring-1 focus:ring-gold/60";
  const borda = (k: keyof Campos) => (erros[k] ? "border-wine-text/70" : "border-white/10 hover:border-gold/30");

  const erro = (k: keyof Campos) =>
    erros[k] ? (
      <p id={`${id(k)}-erro`} className="mt-2 flex items-start gap-1.5 text-[0.8rem] text-wine-text">
        <Icon name="alerta" className="mt-0.5 size-3.5 shrink-0" /> {erros[k]}
      </p>
    ) : null;

  const aria = (k: keyof Campos, hint?: boolean) => ({
    id: id(k),
    "aria-invalid": erros[k] ? true : undefined,
    "aria-describedby": [erros[k] ? `${id(k)}-erro` : "", hint ? `${id(k)}-dica` : ""].filter(Boolean).join(" ") || undefined,
  });

  return (
    <form noValidate onSubmit={onSubmit} className="card p-7 md:p-10" aria-labelledby={`${uid}-titulo`}>
      <h2 id={`${uid}-titulo`} className="text-2xl md:text-3xl">
        Envie sua mensagem
      </h2>
      <p className="mt-3 text-sm text-muted">
        Campos marcados com <span className="text-gold">*</span> são obrigatórios. Ao enviar, o WhatsApp do advogado responsável pela área será aberto com a sua mensagem pronta.
      </p>

      {listaErros.length > 0 && (
        <div ref={resumoRef} tabIndex={-1} role="alert" className="mt-6 border border-wine-text/40 bg-wine-deep/30 p-4 text-sm focus:outline-none">
          <p className="font-semibold text-ivory">Revise {listaErros.length === 1 ? "o campo abaixo" : `os ${listaErros.length} campos abaixo`}:</p>
          <ul className="mt-2 space-y-1">
            {listaErros.map(([k, msg]) => (
              <li key={k}>
                <a href={`#${id(k)}`} className="text-wine-text underline underline-offset-2 hover:text-ivory">
                  {rotulos[k]}: {msg}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {enviado && (
        <div ref={statusRef} tabIndex={-1} role="status" className="mt-6 flex gap-3 border border-gold/40 bg-gold/5 p-4 text-sm focus:outline-none">
          <Icon name="check" className="mt-0.5 size-5 shrink-0 text-gold" />
          <p>
            Sua mensagem foi preparada no WhatsApp de {enviado.nome}. Para concluir, confirme o envio no aplicativo. Se a janela não abriu,{" "}
            <a href={enviado.href} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2 hover:text-ivory">
              clique aqui para abrir o WhatsApp
            </a>
            .
          </p>
        </div>
      )}

      {falha && (
        <p role="alert" className="mt-6 border border-wine-text/40 bg-wine-deep/30 p-4 text-sm text-ivory">
          {falha}
        </p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor={id("nome")} className="text-sm text-paper">
            Nome completo <span className="text-gold">*</span>
          </label>
          <input
            {...aria("nome")}
            type="text"
            name="nome"
            autoComplete="name"
            value={campos.nome}
            onChange={(e) => set("nome", e.target.value)}
            className={`${campoBase} ${borda("nome")}`}
          />
          {erro("nome")}
        </div>

        <div>
          <label htmlFor={id("telefone")} className="text-sm text-paper">
            Telefone / WhatsApp <span className="text-gold">*</span>
          </label>
          <input
            {...aria("telefone")}
            type="tel"
            name="telefone"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(DDD) 9 0000-0000"
            value={campos.telefone}
            onChange={(e) => set("telefone", e.target.value)}
            className={`${campoBase} ${borda("telefone")}`}
          />
          {erro("telefone")}
        </div>

        <div>
          <label htmlFor={id("email")} className="text-sm text-paper">
            E-mail <span className="text-muted">(opcional)</span>
          </label>
          <input
            {...aria("email")}
            type="email"
            name="email"
            autoComplete="email"
            value={campos.email}
            onChange={(e) => set("email", e.target.value)}
            className={`${campoBase} ${borda("email")}`}
          />
          {erro("email")}
        </div>

        <div>
          <label htmlFor={id("area")} className="text-sm text-paper">
            Área do assunto <span className="text-gold">*</span>
          </label>
          <div className="relative">
            <select
              {...aria("area", true)}
              name="area"
              value={campos.area}
              onChange={(e) => set("area", e.target.value as AreaSlug | "")}
              className={`${campoBase} ${borda("area")} appearance-none pr-10`}
            >
              <option value="">Selecione</option>
              {areas.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.nome}
                </option>
              ))}
            </select>
            <Icon name="setaBaixo" className="pointer-events-none absolute right-4 top-1/2 mt-1 size-4 -translate-y-1/2 text-gold" />
          </div>
          <p id={`${id("area")}-dica`} className="mt-2 text-xs text-muted">
            Se tiver dúvida, escolha a mais próxima.
          </p>
          {erro("area")}
        </div>

        <div>
          <label htmlFor={id("cidade")} className="text-sm text-paper">
            Cidade <span className="text-muted">(opcional)</span>
          </label>
          <input
            {...aria("cidade")}
            type="text"
            name="cidade"
            autoComplete="address-level2"
            value={campos.cidade}
            onChange={(e) => set("cidade", e.target.value)}
            className={`${campoBase} ${borda("cidade")}`}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor={id("mensagem")} className="text-sm text-paper">
            Mensagem <span className="text-gold">*</span>
          </label>
          <textarea
            {...aria("mensagem", true)}
            name="mensagem"
            rows={5}
            maxLength={1500}
            value={campos.mensagem}
            onChange={(e) => set("mensagem", e.target.value)}
            className={`${campoBase} ${borda("mensagem")} resize-y`}
          />
          <p id={`${id("mensagem")}-dica`} className="mt-2 flex justify-between gap-4 text-xs text-muted">
            <span>Descreva o assunto de forma breve. Detalhes sensíveis podem ser tratados no atendimento.</span>
            <span aria-hidden="true">{campos.mensagem.length}/1500</span>
          </p>
          {erro("mensagem")}
        </div>

        <div className="md:col-span-2">
          <div className="flex items-start gap-3">
            <input
              {...aria("consentimento")}
              type="checkbox"
              name="consentimento"
              checked={campos.consentimento}
              onChange={(e) => set("consentimento", e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-wine"
            />
            <label htmlFor={id("consentimento")} className="text-sm text-paper">
              Concordo com o uso dos dados informados exclusivamente para o retorno deste contato, conforme a{" "}
              <Link href="/politica-de-privacidade" className="text-gold underline underline-offset-2 hover:text-ivory">
                Política de Privacidade
              </Link>
              . <span className="text-gold">*</span>
            </label>
          </div>
          {erro("consentimento")}
        </div>
      </div>

      <button type="submit" className={`${buttonClasses("primary")} mt-9 w-full md:w-auto`}>
        <Icon name="whatsapp" className="size-4.5" />
        Enviar pelo WhatsApp
      </button>
    </form>
  );
}

function montarMensagem(c: Campos, areaNome: string, destinatario: string) {
  const opcional = (rotulo: string, valor: string) => (valor.trim() ? [`${rotulo}: ${valor.trim()}`] : []);
  return [
    `Olá, ${destinatario}. Entrei em contato pelo site da Ledesma Advocacia.`,
    "",
    `Nome: ${c.nome.trim()}`,
    `Telefone: ${c.telefone.trim()}`,
    ...opcional("E-mail", c.email),
    ...opcional("Cidade", c.cidade),
    `Área: ${areaNome}`,
    "",
    c.mensagem.trim(),
  ].join("\n");
}
