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
      // Sessão só na aba atual: some ao fechá-la. No GitHub Pages, todos os sites de elsilveira.github.io
      // compartilham o mesmo localStorage; o sessionStorage também é por origem, mas não sobrevive à aba.
      storage: typeof window === "undefined" ? undefined : window.sessionStorage,
      storageKey: "ledesma-cms-sessao",
    },
  });
  return cliente;
}
