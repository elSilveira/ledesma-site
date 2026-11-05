/**
 * Detecta segredos colocados por engano em variáveis públicas.
 *
 * Toda variável com prefixo NEXT_PUBLIC_ é copiada para o código entregue ao navegador. O build
 * (next.config.ts) e `npm run supabase:verificar` usam esta checagem para recusar chaves secretas.
 * Não importa outros módulos: também é lido diretamente pelo Node em scripts/.
 */

/** Papel gravado numa chave JWT do Supabase (formato antigo "anon"/"service_role"). */
function papelJwt(valor: string): string | null {
  const partes = valor.split(".");
  if (partes.length !== 3) return null;
  try {
    const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(partes[1].length / 4) * 4, "=");
    const conteudo = JSON.parse(atob(base64)) as { role?: unknown };
    return typeof conteudo.role === "string" ? conteudo.role : null;
  } catch {
    return null;
  }
}

/** Motivo pelo qual o valor parece um segredo, ou null se parecer seguro para o navegador. */
export function motivoSegredo(valor: string): string | null {
  const v = valor.trim();
  if (!v) return null;
  if (v.startsWith("sb_secret_")) return "chave secreta do Supabase (sb_secret_)";
  const papel = papelJwt(v);
  if (papel && papel !== "anon") return `chave JWT com papel "${papel}"`;
  if (/^(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}$/.test(v) || v.startsWith("github_pat_")) return "token do GitHub";
  if (/^postgres(ql)?:\/\/[^:/\s]+:[^@\s]+@/i.test(v)) return "endereço do banco com senha";
  return null;
}

/** Nomes (nunca os valores) das variáveis NEXT_PUBLIC_ que contêm algo com cara de segredo. */
export function variaveisPublicasComSegredo(env: Record<string, string | undefined>): string[] {
  return Object.entries(env)
    .filter(([nome, valor]) => nome.startsWith("NEXT_PUBLIC_") && valor && motivoSegredo(valor))
    .map(([nome, valor]) => `${nome} (${motivoSegredo(valor!)})`);
}
