// Edge Function "disparar-deploy": dispara o workflow do GitHub Pages quando há pedidos de atualização do site.
//
// Quem chama: o próprio banco (gatilho em pedidos_atualizacao, via pg_net), com o cabeçalho x-cms-segredo.
// Publicar com a verificação de JWT desligada: a proteção é o segredo compartilhado, conferido abaixo.
//
// Segredos (Supabase > Edge Functions > Secrets), nunca no navegador nem no repositório:
//   CMS_WEBHOOK_SEGREDO  o mesmo valor guardado no Vault como "cms_webhook_segredo"
//   GITHUB_TOKEN         token granular só do repositório, permissão "Actions: Read and write"
//   GITHUB_REPOSITORIO   ex.: elSilveira/ledesma-site
//   GITHUB_WORKFLOW      opcional (padrão: pages.yml)
//   GITHUB_BRANCH        opcional (padrão: main)
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são fornecidos pelo próprio Supabase.
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

/** Chama uma função do banco com a chave de serviço (só existe no servidor das Edge Functions). */
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

export async function tratar(req: Request, env: Ambiente, buscar: typeof fetch = fetch): Promise<Response> {
  if (req.method !== "POST") return resposta(405, { erro: "método não permitido" });

  const segredo = env("CMS_WEBHOOK_SEGREDO");
  if (!segredo || !(await iguais(req.headers.get("x-cms-segredo") ?? "", segredo))) {
    return resposta(401, { erro: "não autorizado" });
  }

  const token = env("GITHUB_TOKEN");
  const repositorio = env("GITHUB_REPOSITORIO");
  if (!token || !repositorio) return resposta(500, { erro: "GITHUB_TOKEN ou GITHUB_REPOSITORIO não configurado" });

  try {
    // Agrupa os pedidos pendentes; se já há um disparo que ainda não começou, não dispara de novo
    const [preparo] = (await rpc(env, buscar, "preparar_disparo", {})) ?? [];
    if (!preparo?.deve_disparar) return resposta(200, { disparado: false, deploy: preparo?.id_deploy ?? null });
    const deploy = preparo.id_deploy as number;

    const workflow = env("GITHUB_WORKFLOW") || "pages.yml";
    const branch = env("GITHUB_BRANCH") || "main";
    const r = await buscar(`https://api.github.com/repos/${repositorio}/actions/workflows/${workflow}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ledesma-cms",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: branch, inputs: { cms_deploy_id: String(deploy) } }),
    });
    const corpoGithub = await r.text();

    if (r.status !== 204 && r.status !== 200) {
      // Só a mensagem pública do GitHub (ex.: "Resource not accessible by personal access token"), nunca o token
      let motivo = "";
      try {
        motivo = String((JSON.parse(corpoGithub) as { message?: unknown }).message ?? "").replace(/[^w .,:;()'/-]/g, "").trim().slice(0, 160);
      } catch {
        motivo = "";
      }
      const detalhes = `o GitHub recusou o disparo (${r.status}${motivo ? `: ${motivo}` : ""})${r.status === 401 || r.status === 403 ? "; confira o GITHUB_TOKEN (Actions: Read and write neste repositório)" : ""}`;
      await rpc(env, buscar, "falha_disparo", { p_deploy_id: deploy, p_detalhes: detalhes });
      console.error(`disparar-deploy: ${detalhes}`);
      return resposta(502, { disparado: false, deploy, erro: detalhes });
    }
    return resposta(200, { disparado: true, deploy });
  } catch (e) {
    console.error(`disparar-deploy: ${e instanceof Error ? e.message : String(e)}`);
    return resposta(500, { erro: "falha interna; o agendamento do workflow tentará de novo" });
  }
}

// No Supabase (Deno), atende as chamadas; fora dele (testes), só exporta "tratar"
const deno = (globalThis as unknown as { Deno?: { serve(h: (req: Request) => Promise<Response>): void; env: { get(nome: string): string | undefined } } }).Deno;
if (deno) deno.serve((req) => tratar(req, (nome) => deno.env.get(nome)));
