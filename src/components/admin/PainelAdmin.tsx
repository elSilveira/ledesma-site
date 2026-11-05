"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseConfigurado, supabaseNavegador } from "@/lib/supabase/cliente";
import { TelaInicio } from "./Inicio";
import { avaliarSessao, type Etapa } from "./sessao";
import { Cartao, TelaCadastrarMfa, TelaLogin, TelaSemAutorizacao, TelaVerificarMfa } from "./telas";

/**
 * Painel do CMS (/admin). Roda inteiro no navegador, compatível com o export estático do GitHub Pages.
 * As telas só organizam o acesso: quem pode ler ou alterar cada dado é decidido pelo banco (RLS e MFA).
 */
export function PainelAdmin() {
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "carregando" });

  const atualizar = useCallback(async () => {
    try {
      setEtapa(await avaliarSessao(supabaseNavegador()));
    } catch {
      setEtapa({ tipo: "login" });
    }
  }, []);

  useEffect(() => {
    if (!supabaseConfigurado) return;
    const supabase = supabaseNavegador();
    let montado = true;
    avaliarSessao(supabase).then(
      (proxima) => montado && setEtapa(proxima),
      () => montado && setEtapa({ tipo: "login" }),
    );
    // Sessão expirada ou encerrada em outra aba: volta para o login
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") setEtapa({ tipo: "login" });
    });
    return () => {
      montado = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const sair = useCallback(async () => {
    await supabaseNavegador().auth.signOut({ scope: "local" });
    setEtapa({ tipo: "login" });
  }, []);

  if (!supabaseConfigurado) {
    return (
      <Cartao eyebrow="Configuração" titulo="Painel não configurado">
        <p className="mt-4 text-sm text-paper">
          Este build não tem a URL e a chave pública do Supabase. Veja <code className="text-ivory">supabase/README.md</code>.
        </p>
      </Cartao>
    );
  }

  switch (etapa.tipo) {
    case "carregando":
      return (
        <p className="text-sm text-muted" aria-live="polite">
          Verificando o acesso…
        </p>
      );
    case "login":
      return <TelaLogin aoEntrar={atualizar} />;
    case "sem-autorizacao":
      return <TelaSemAutorizacao email={etapa.email} aoSair={sair} />;
    case "verificar-mfa":
      return <TelaVerificarMfa factorId={etapa.factorId} aoConcluir={atualizar} aoSair={sair} />;
    case "cadastrar-mfa":
      return <TelaCadastrarMfa obrigatorio={etapa.obrigatorio} aoConcluir={atualizar} aoCancelar={() => void atualizar()} aoSair={sair} />;
    case "inicio":
      return (
        <TelaInicio
          perfil={etapa.perfil}
          temMfa={etapa.temMfa}
          aoCadastrarMfa={() => setEtapa({ tipo: "cadastrar-mfa", perfil: etapa.perfil, obrigatorio: false })}
          aoSair={sair}
        />
      );
  }
}
