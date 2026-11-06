"use client";

import { TelaAutorizar } from "./Autorizar";
import { PainelAdmin } from "./PainelAdmin";

/** Login (e MFA, para admin) pelo mesmo fluxo do painel; depois, a tela de consentimento. */
export function PaginaAutorizar() {
  return <PainelAdmin conteudo={(perfil, sair) => <TelaAutorizar perfil={perfil} aoSair={sair} />} />;
}
