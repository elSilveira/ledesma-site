import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

export type Papel = "admin" | "advogado";

export type Perfil = { userId: string; papel: Papel; integrante: string | null; email: string };

/** Em que ponto do acesso a pessoa está; decidido só pelo que o Supabase devolve. */
export type Etapa =
  | { tipo: "carregando" }
  | { tipo: "login" }
  | { tipo: "sem-autorizacao"; email: string }
  | { tipo: "verificar-mfa"; perfil: Perfil; factorId: string }
  | { tipo: "cadastrar-mfa"; perfil: Perfil; obrigatorio: boolean }
  | { tipo: "inicio"; perfil: Perfil; temMfa: boolean };

/**
 * Lê a sessão e decide a próxima tela:
 * sem sessão -> login · sem perfil ativo -> sem autorização · MFA cadastrado e não verificado -> código ·
 * admin sem MFA -> cadastro obrigatório · demais -> início.
 * O acesso aos dados continua decidido pelo banco (RLS); isto só escolhe a tela.
 */
export async function avaliarSessao(supabase: SupabaseClient): Promise<Etapa> {
  const { data: sessao } = await supabase.auth.getSession();
  const usuario = sessao.session?.user;
  if (!usuario) return { tipo: "login" };

  // A política de perfis deixa cada pessoa ler a própria linha, mesmo antes do MFA
  const { data: linha, error } = await supabase
    .from("perfis")
    .select("papel, integrante, ativo")
    .eq("user_id", usuario.id)
    .maybeSingle();
  const email = usuario.email ?? "";
  if (error || !linha || !linha.ativo) return { tipo: "sem-autorizacao", email };

  const perfil: Perfil = { userId: usuario.id, papel: linha.papel as Papel, integrante: linha.integrante, email };

  const [nivel, fatores] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  const totpVerificado = fatores.data?.all.find((f) => f.factor_type === "totp" && f.status === "verified");

  if (totpVerificado && nivel.data?.currentLevel !== "aal2") {
    return { tipo: "verificar-mfa", perfil, factorId: totpVerificado.id };
  }
  if (!totpVerificado && perfil.papel === "admin") {
    return { tipo: "cadastrar-mfa", perfil, obrigatorio: true };
  }
  return { tipo: "inicio", perfil, temMfa: Boolean(totpVerificado) };
}

/** Mensagens em português, sem detalhes internos. */
export function traduzirErro(erro: AuthError | Error | null | undefined, contexto: "login" | "codigo" | "geral"): string {
  const msg = erro?.message ?? "";
  const status = "status" in (erro ?? {}) ? (erro as AuthError).status : undefined;
  if (status === 429 || /rate limit|too many/i.test(msg)) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  if (/failed to fetch|network/i.test(msg)) return "Sem conexão com o servidor. Verifique a internet e tente de novo.";
  if (contexto === "login") {
    if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
    if (/email not confirmed/i.test(msg)) return "Este e-mail ainda não foi confirmado.";
    return "Não foi possível entrar. Tente novamente.";
  }
  if (contexto === "codigo") {
    if (/invalid|expired/i.test(msg)) return "Código incorreto ou expirado. Use o código atual do aplicativo.";
    return "Não foi possível confirmar o código. Tente novamente.";
  }
  return "Algo deu errado. Tente novamente.";
}
