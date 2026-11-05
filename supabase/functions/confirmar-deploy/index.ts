// Edge Function "confirmar-deploy": recebe do workflow do GitHub Pages o início, a conclusão ou a falha de um deploy
// e atualiza o CMS. Só depois da conclusão os artigos aparecem como "no ar" no painel (função confirmar_deploy).
//
// Quem chama: o workflow (.github/workflows/pages.yml), com o cabeçalho x-cms-segredo.
// Publicar com a verificação de JWT desligada: a proteção é o segredo compartilhado, conferido abaixo.
//
// Segredo (Supabase > Edge Functions > Secrets), o mesmo valor do segredo CMS_DEPLOY_SEGREDO do GitHub:
//   CMS_DEPLOY_SEGREDO
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são fornecidos pelo próprio Supabase.
//
// Corpo (JSON):
//   { "etapa": "inicio", "run_id": 123, "cms_deploy_id": "45" (ou vazio), "iniciado_em": "2026-11-06T12:00:00.000Z" }
//   { "etapa": "concluido", "run_id": 123, "iniciado_em": "...", "manifesto": { "slug-do-artigo": 3, ... } }
//   { "etapa": "falhou" | "cancelado", "run_id": 123, "detalhes": "..." }
//
// Arquivo único e sem dependências, para poder ser colado no editor de funções do painel do Supabase.

type Ambiente = (nome: string) => string | undefined;

const resposta = (status: number, corpo: Record<string, unknown>) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });

/** Compara em tempo constante (resumo SHA-256 dos dois lados), sem revelar o segredo pela demora da resposta. */
async function iguais(recebido: string, esperado: string) {
  const resumo = async (t: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)));
  const [a, b] = await Promise.all([resumo(recebido), resumo(esperado)]);
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a[i] ^ b[i];
  return diferenca === 0;
}

async function rpc(env: Ambiente, buscar: typeof fetch, nome: string, argumentos: Record<string, unknown>) {
  const url = env("SUPABASE_URL");
  const chave = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !chave) throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente");
  const r = await buscar(`${url}/rest/v1/rpc/${nome}`, {
    method: "POST",
    headers: { apikey: chave, Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify(argumentos),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${nome}: ${r.status} ${texto.slice(0, 200)}`);
  return texto ? JSON.parse(texto) : null;
}

const ehData = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));
const ehRun = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v > 0;
const ehManifesto = (v: unknown): v is Record<string, number> =>
  !!v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.entries(v).every(([slug, revisao]) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && Number.isSafeInteger(revisao) && (revisao as number) > 0);

export async function tratar(req: Request, env: Ambiente, buscar: typeof fetch = fetch): Promise<Response> {
  if (req.method !== "POST") return resposta(405, { erro: "método não permitido" });

  const segredo = env("CMS_DEPLOY_SEGREDO");
  if (!segredo || !(await iguais(req.headers.get("x-cms-segredo") ?? "", segredo))) {
    return resposta(401, { erro: "não autorizado" });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return resposta(400, { erro: "corpo inválido" });
  }
  const { etapa, run_id: runId } = corpo;
  if (!ehRun(runId)) return resposta(400, { erro: "run_id inválido" });

  try {
    if (etapa === "inicio") {
      if (!ehData(corpo.iniciado_em)) return resposta(400, { erro: "iniciado_em inválido" });
      const id = Number(corpo.cms_deploy_id);
      await rpc(env, buscar, "registrar_inicio_deploy", {
        p_deploy_id: Number.isSafeInteger(id) && id > 0 ? id : null,
        p_github_run_id: runId,
        p_iniciado_em: corpo.iniciado_em,
      });
    } else if (etapa === "concluido") {
      if (!ehData(corpo.iniciado_em)) return resposta(400, { erro: "iniciado_em inválido" });
      if (!ehManifesto(corpo.manifesto)) return resposta(400, { erro: "manifesto inválido" });
      // Função já existente: marca o que está no ar e os pedidos anteriores ao início do build
      await rpc(env, buscar, "confirmar_deploy", {
        p_github_run_id: runId,
        p_build_iniciado_em: corpo.iniciado_em,
        p_manifesto: corpo.manifesto,
      });
    } else if (etapa === "falhou" || etapa === "cancelado") {
      await rpc(env, buscar, "registrar_fim_deploy", {
        p_github_run_id: runId,
        p_situacao: etapa,
        p_detalhes: typeof corpo.detalhes === "string" ? corpo.detalhes.slice(0, 500) : "",
      });
    } else {
      return resposta(400, { erro: "etapa inválida" });
    }
    return resposta(200, { ok: true, etapa });
  } catch (e) {
    console.error(`confirmar-deploy: ${e instanceof Error ? e.message : String(e)}`);
    return resposta(500, { erro: "falha ao registrar no CMS" });
  }
}

// No Supabase (Deno), atende as chamadas; fora dele (testes), só exporta "tratar"
const deno = (globalThis as unknown as { Deno?: { serve(h: (req: Request) => Promise<Response>): void; env: { get(nome: string): string | undefined } } }).Deno;
if (deno) deno.serve((req) => tratar(req, (nome) => deno.env.get(nome)));
