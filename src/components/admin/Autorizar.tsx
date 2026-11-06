"use client";

import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/cliente";
import { buttonClasses } from "../Button";
import { Icon } from "../icons";
import { Cartao } from "./telas";
import type { Perfil } from "./sessao";

type Pedido = { id: string; aplicativo: string; destino: string };

type Estado =
  | { tipo: "carregando" }
  | { tipo: "pedido"; pedido: Pedido }
  | { tipo: "enviando"; pedido: Pedido }
  | { tipo: "redirecionando" }
  | { tipo: "erro"; mensagem: string };

const PODE = [
  "ver os artigos do CMS e a situação do site",
  "criar e editar rascunhos",
  "publicar e retirar artigos do site, só depois da sua confirmação na conversa",
];

/** Lado do servidor de autorização (Claude, Codex) para onde o usuário volta depois de decidir. */
function hostDe(url: string) {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

/**
 * Tela de consentimento do OAuth (Supabase Auth) para conectar o servidor MCP de artigos.
 * Só aparece depois do login e, para admin, do MFA: o PainelAdmin cuida disso antes.
 */
export function TelaAutorizar({ perfil, aoSair }: { perfil: Perfil; aoSair: () => void }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("authorization_id");
    const supabase = supabaseNavegador();
    let ativo = true;
    (async () => {
      if (!id) return { tipo: "erro", mensagem: "Pedido de autorização não encontrado. Comece a conexão de novo pelo Claude ou pelo Codex." } as Estado;
      // Com MFA nesta sessão, registra que a autorização foi feita com o segundo fator (vale 30 dias para o MCP)
      const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (nivel?.currentLevel === "aal2") {
        const { error } = await supabase.rpc("registrar_autorizacao_oauth");
        if (error && perfil.papel === "admin") return { tipo: "erro", mensagem: "Não foi possível registrar a autorização. Tente de novo." } as Estado;
      }
      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
      if (error || !data) return { tipo: "erro", mensagem: "Este pedido de autorização expirou ou não é válido. Comece a conexão de novo." } as Estado;
      if (!("authorization_id" in data)) {
        // Já autorizado antes: volta direto para o aplicativo
        window.location.assign(data.redirect_url);
        return { tipo: "redirecionando" } as Estado;
      }
      return { tipo: "pedido", pedido: { id: data.authorization_id, aplicativo: data.client?.name || "Aplicativo sem nome", destino: hostDe(data.redirect_uri) } } as Estado;
    })().then(
      (proximo) => ativo && setEstado(proximo),
      () => ativo && setEstado({ tipo: "erro", mensagem: "Não foi possível carregar o pedido. Verifique a conexão e tente de novo." }),
    );
    return () => {
      ativo = false;
    };
  }, [perfil.papel]);

  async function decidir(pedido: Pedido, permitir: boolean) {
    setEstado({ tipo: "enviando", pedido });
    const supabase = supabaseNavegador();
    const { data, error } = permitir ? await supabase.auth.oauth.approveAuthorization(pedido.id) : await supabase.auth.oauth.denyAuthorization(pedido.id);
    if (error || !data?.redirect_url) {
      setEstado({ tipo: "erro", mensagem: "Não foi possível concluir. O pedido pode ter expirado (10 minutos); comece a conexão de novo." });
      return;
    }
    setEstado({ tipo: "redirecionando" });
    window.location.assign(data.redirect_url);
  }

  if (estado.tipo === "carregando" || estado.tipo === "redirecionando") {
    return (
      <p className="text-sm text-muted" aria-live="polite">
        {estado.tipo === "carregando" ? "Carregando o pedido…" : "Voltando para o aplicativo…"}
      </p>
    );
  }

  if (estado.tipo === "erro") {
    return (
      <Cartao eyebrow="Conectar aplicativo" titulo="Não deu certo">
        <p role="alert" className="mt-5 flex items-start gap-2 border border-wine-text/40 bg-wine-deep/30 p-3.5 text-sm text-ivory">
          <Icon name="alerta" className="mt-0.5 size-4 shrink-0 text-wine-text" /> {estado.mensagem}
        </p>
        <button type="button" onClick={aoSair} className={`${buttonClasses("ghost")} mt-6`}>
          Sair
        </button>
      </Cartao>
    );
  }

  const { pedido } = estado;
  const enviando = estado.tipo === "enviando";
  return (
    <Cartao eyebrow="Conectar aplicativo" titulo={`Permitir acesso a ${pedido.aplicativo}?`} largo>
      <p className="mt-4 text-sm text-paper">
        Entrou como <span className="text-ivory">{perfil.email}</span>. O aplicativo vai agir em seu nome, com as mesmas permissões que você tem no
        painel:
      </p>
      <ul className="mt-5 space-y-2.5 text-sm text-paper">
        {PODE.map((t) => (
          <li key={t} className="flex items-start gap-2.5">
            <Icon name="check" className="mt-0.5 size-4 shrink-0 text-gold" /> {t}
          </li>
        ))}
        <li className="flex items-start gap-2.5">
          <Icon name="alerta" className="mt-0.5 size-4 shrink-0 text-muted" /> não pode excluir artigos (só pelo painel)
        </li>
      </ul>
      <p className="mt-5 text-xs text-muted">
        Depois de decidir, você volta para <span className="text-paper">{pedido.destino}</span>. Só permita se foi você quem iniciou a conexão.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" disabled={enviando} onClick={() => void decidir(pedido, true)} className={buttonClasses("primary")}>
          {enviando ? "Enviando…" : "Permitir"}
        </button>
        <button type="button" disabled={enviando} onClick={() => void decidir(pedido, false)} className={buttonClasses("ghost")}>
          Recusar
        </button>
      </div>
    </Cartao>
  );
}
