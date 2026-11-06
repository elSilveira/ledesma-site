import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do Supabase para o navegador (painel /admin do CMS).
 *
 * Usa só a chave pública (publishable/anon): quem protege os dados são as políticas de RLS
 * em supabase/migrations. Nenhuma chave secreta pode ter prefixo NEXT_PUBLIC_, porque tudo o que
 * tem esse prefixo vai para o código entregue ao navegador.
 *
 * Importado só pelo painel /admin: o site público continua lendo src/content/articles.ts.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const chavePublica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

// O build já recusa segredos em NEXT_PUBLIC_ (next.config.ts); a URL precisa ser do Supabase, com https
export const supabaseConfigurado = Boolean(url && chavePublica && /^https:\/\/[^/\s]+$/.test(url));

const CHAVE_SESSAO = "ledesma-cms-sessao";
const CHAVE_LEMBRAR = "ledesma-cms-lembrar-ate";
export const DIAS_LEMBRAR = 60;

/** Data (ms) até quando este computador está lembrado; vencido, apaga a sessão guardada. */
function lembradoAte(): number | null {
  try {
    const ate = Number(window.localStorage.getItem(CHAVE_LEMBRAR));
    if (ate && ate > Date.now()) return ate;
    if (ate) {
      window.localStorage.removeItem(CHAVE_LEMBRAR);
      window.localStorage.removeItem(CHAVE_SESSAO);
    }
  } catch {
    // navegador sem acesso ao armazenamento: fica só a sessão da aba
  }
  return null;
}

/**
 * Onde a sessão fica: na aba (some ao fechá-la) ou, com "lembrar este computador", no navegador até a data
 * escolhida. Passado o prazo, a sessão guardada é apagada e é preciso entrar de novo (senha e código).
 */
const armazenamento = {
  getItem: (k: string) => (lembradoAte() ? window.localStorage : window.sessionStorage).getItem(k),
  setItem: (k: string, v: string) => (lembradoAte() ? window.localStorage : window.sessionStorage).setItem(k, v),
  removeItem: (k: string) => {
    window.sessionStorage.removeItem(k);
    try {
      window.localStorage.removeItem(k);
    } catch {
      // sem acesso: nada guardado ali
    }
  },
};

/** Guarda a sessão atual (já com o segundo fator) neste navegador por DIAS_LEMBRAR dias. */
export function lembrarEsteComputador() {
  try {
    const sessao = window.sessionStorage.getItem(CHAVE_SESSAO);
    if (!sessao) return;
    window.localStorage.setItem(CHAVE_LEMBRAR, String(Date.now() + DIAS_LEMBRAR * 24 * 60 * 60 * 1000));
    window.localStorage.setItem(CHAVE_SESSAO, sessao);
    window.sessionStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // sem acesso ao armazenamento: continua só na aba
  }
}

/** Ao sair: deixa de lembrar este computador. */
export function esquecerEsteComputador() {
  try {
    window.localStorage.removeItem(CHAVE_LEMBRAR);
    window.localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // nada a apagar
  }
}

let cliente: SupabaseClient | undefined;

export function supabaseNavegador(): SupabaseClient {
  if (!supabaseConfigurado || !url || !chavePublica) {
    throw new Error("Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL (https, sem barra no final) e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (veja supabase/README.md).");
  }
  cliente ??= createClient(url, chavePublica, {
    auth: {
      // PKCE: o link de recuperação de senha devolve um código de uso único, não o token na URL
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Padrão: sessão só na aba atual (some ao fechá-la). Com "lembrar este computador", fica no localStorage
      // por 60 dias. Atenção: no GitHub Pages, todos os sites de elsilveira.github.io compartilham o localStorage.
      storage: typeof window === "undefined" ? undefined : armazenamento,
      storageKey: CHAVE_SESSAO,
    },
  });
  return cliente;
}
