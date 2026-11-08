// Edge Function "gerenciar-usuarios": cadastro de usuários do CMS pelo painel (área "Usuários").
//
// Quem chama: o painel /admin, com o token da pessoa logada. Só admin com MFA (public.sou_admin()) passa.
// A chave service_role e a chave do Resend existem só aqui, nos segredos da função; nunca no navegador.
//
// Ações (POST JSON { acao, ... }):
//   criar       { email, papel: "admin" | "advogado", integrante? }  cria a conta com senha aleatória e envia por e-mail
//   nova_senha  { user_id }                                          gera outra senha temporária e envia por e-mail
//   zerar_mfa   { user_id }                                          remove o MFA (celular perdido); cadastra de novo no próximo acesso
// Ninguém age sobre a própria conta. Ativar/desativar e trocar o papel usam public.autorizar_usuario (RLS).
//
// Sem RESEND_API_KEY/EMAIL_REMETENTE, a senha temporária volta uma única vez para o admin que cadastrou (para entregar
// pessoalmente); com eles, vai só por e-mail e nunca passa pelo navegador.
// Segredos: RESEND_API_KEY, EMAIL_REMETENTE (ex.: "Ledesma Advocacia <nao-responda@seudominio.com.br>"),
//           PAINEL_URL (opcional; padrão: https://ledesma.adv.br/admin/).
// SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são fornecidos pelo próprio Supabase.
// Publicar com --no-verify-jwt: o token é conferido abaixo, pelo próprio banco.

type Ambiente = (nome: string) => string | undefined;
type Json = Record<string, unknown>;

const PAINEL_PADRAO = "https://ledesma.adv.br/admin/";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const resposta = (status: number, corpo: Json) => new Response(JSON.stringify(corpo), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });

class Recusa extends Error {
  status: number;
  constructor(mensagem: string, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

/** Senha temporária: 16 caracteres sem os ambíguos (0/O, 1/l/I), com maiúscula, minúscula, número e símbolo. */
export function senhaAleatoria(tamanho = 16) {
  const grupos = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%*?-"];
  const todos = grupos.join("");
  const aleatorio = (n: number) => {
    // Rejeição para não enviesar a distribuição
    const limite = Math.floor(256 / n) * n;
    const b = new Uint8Array(1);
    do crypto.getRandomValues(b);
    while (b[0] >= limite);
    return b[0] % n;
  };
  const chars = grupos.map((g) => g[aleatorio(g.length)]);
  while (chars.length < tamanho) chars.push(todos[aleatorio(todos.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function email({ nome, email, senha, painel, nova }: { nome: string | null; email: string; senha: string; painel: string; nova: boolean }) {
  const ola = nome ? `Olá, ${nome}.` : "Olá.";
  const intro = nova
    ? "Uma nova senha temporária foi gerada para o seu acesso ao painel de artigos do site da Ledesma Advocacia."
    : "Seu acesso ao painel de artigos do site da Ledesma Advocacia foi criado.";
  const passos = [
    "Entre no painel com o seu e-mail e a senha temporária abaixo.",
    "Crie uma senha nova (a temporária deixa de valer).",
    "Cadastre a verificação em duas etapas com um aplicativo autenticador no celular (Google Authenticator, Microsoft Authenticator…).",
  ];
  const texto = `${ola}

${intro}

Endereço: ${painel}
E-mail: ${email}
Senha temporária: ${senha}

No primeiro acesso:
${passos.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Não encaminhe este e-mail. Se você não esperava esta mensagem, avise o escritório.`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f1f1f;max-width:560px">
<p>${escapar(ola)}</p>
<p>${escapar(intro)}</p>
<table style="border-collapse:collapse;margin:16px 0">
<tr><td style="padding:4px 16px 4px 0;color:#666">Endereço</td><td><a href="${escapar(painel)}">${escapar(painel)}</a></td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#666">E-mail</td><td>${escapar(email)}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#666">Senha temporária</td><td style="font-family:Consolas,monospace;font-size:17px;letter-spacing:1px"><strong>${escapar(senha)}</strong></td></tr>
</table>
<p>No primeiro acesso:</p>
<ol>${passos.map((p) => `<li>${escapar(p)}</li>`).join("")}</ol>
<p style="color:#666;font-size:13px">Não encaminhe este e-mail. Se você não esperava esta mensagem, avise o escritório.</p>
</div>`;
  return { assunto: nova ? "Nova senha temporária: painel da Ledesma Advocacia" : "Seu acesso ao painel da Ledesma Advocacia", texto, html };
}

export async function tratar(req: Request, env: Ambiente, buscar: typeof fetch = fetch): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return resposta(405, { erro: "método não permitido" });

  const url = env("SUPABASE_URL");
  const anon = env("SUPABASE_ANON_KEY") ?? env("SUPABASE_PUBLISHABLE_KEY");
  const servico = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !servico) return resposta(500, { erro: "função sem configuração do Supabase" });

  // 1. Quem chama precisa ser admin com MFA (o banco decide, com o token da própria pessoa)
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return resposta(401, { erro: "faça login no painel" });
  const quem = await buscar(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!quem.ok) return resposta(401, { erro: "sessão expirada; entre de novo" });
  const eu = (await quem.json()) as { id: string };
  const admin = await buscar(`${url}/rest/v1/rpc/sou_admin`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!admin.ok || (await admin.json()) !== true) return resposta(403, { erro: "só administradores (com a verificação em duas etapas) gerenciam usuários" });

  // Chamadas com a chave de serviço (só aqui no servidor)
  const servidor = async (caminho: string, init: RequestInit = {}) => {
    const r = await buscar(`${url}${caminho}`, {
      ...init,
      headers: { apikey: servico, Authorization: `Bearer ${servico}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    const texto = await r.text();
    let corpo: unknown = null;
    try {
      corpo = texto ? JSON.parse(texto) : null;
    } catch {
      corpo = texto;
    }
    return { ok: r.ok, status: r.status, corpo: corpo as Json & Json[] };
  };

  const enviarEmail = async (para: string, nome: string | null, senha: string, nova: boolean) => {
    const chave = env("RESEND_API_KEY");
    const remetente = env("EMAIL_REMETENTE");
    if (!chave || !remetente) return false;
    const m = email({ nome, email: para, senha, painel: env("PAINEL_URL") ?? PAINEL_PADRAO, nova });
    const r = await buscar("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: remetente, to: [para], subject: m.assunto, text: m.texto, html: m.html }),
    });
    if (!r.ok) {
      console.error(`gerenciar-usuarios: Resend respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
      throw new Recusa(`não foi possível enviar o e-mail (${r.status}). Confira o domínio verificado no Resend e o EMAIL_REMETENTE.`, 502);
    }
    return true;
  };

  const perfilDe = async (userId: string) => {
    const r = await servidor(`/rest/v1/perfis?select=user_id,integrante,papel&user_id=eq.${userId}`);
    return r.ok && r.corpo[0] ? (r.corpo[0] as { integrante: string | null; papel: string }) : null;
  };
  const nomeDe = async (integrante: string | null) => {
    if (!integrante) return null;
    const r = await servidor(`/rest/v1/integrantes?select=nome&slug=eq.${encodeURIComponent(integrante)}`);
    return (r.ok && (r.corpo[0]?.nome as string)) || null;
  };
  const alvo = (v: unknown) => {
    if (typeof v !== "string" || !/^[0-9a-f-]{36}$/i.test(v)) throw new Recusa("usuário inválido");
    if (v === eu.id) throw new Recusa("não é possível alterar a própria conta por aqui");
    return v;
  };

  let corpo: Json;
  try {
    corpo = await req.json();
  } catch {
    return resposta(400, { erro: "pedido inválido" });
  }

  try {
    switch (corpo.acao) {
      case "criar": {
        const endereco = typeof corpo.email === "string" ? corpo.email.trim().toLowerCase() : "";
        if (!/^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(endereco) || endereco.length > 200) throw new Recusa("e-mail inválido");
        const papel = corpo.papel;
        if (papel !== "admin" && papel !== "advogado") throw new Recusa("papel inválido");
        const integrante = typeof corpo.integrante === "string" && corpo.integrante ? corpo.integrante : null;
        if (papel === "advogado" && !integrante) throw new Recusa("escolha qual advogado do site é esta pessoa");
        const nome = await nomeDe(integrante);
        if (integrante && !nome) throw new Recusa("advogado não encontrado");

        const senha = senhaAleatoria();
        const criado = await servidor("/auth/v1/admin/users", { method: "POST", body: JSON.stringify({ email: endereco, password: senha, email_confirm: true }) });
        if (!criado.ok) {
          if (criado.status === 422 || /already|exists|registered/i.test(JSON.stringify(criado.corpo))) throw new Recusa("já existe uma conta com este e-mail");
          throw new Recusa(`não foi possível criar a conta (${criado.status})`, 502);
        }
        const id = (criado.corpo as Json).id as string;
        const desfazer = () => servidor(`/auth/v1/admin/users/${id}`, { method: "DELETE" });

        const perfil = await servidor("/rest/v1/perfis", {
          method: "POST",
          body: JSON.stringify({ user_id: id, papel, integrante, ativo: true, trocar_senha: true }),
          headers: { Prefer: "return=minimal" },
        });
        if (!perfil.ok) {
          await desfazer();
          throw new Recusa("não foi possível autorizar a conta no CMS", 502);
        }
        let enviado: boolean;
        try {
          enviado = await enviarEmail(endereco, nome, senha, false);
        } catch (e) {
          // O envio falhou: ninguém conhece a senha; desfaz para poder cadastrar de novo
          await desfazer();
          throw e;
        }
        if (!enviado) return resposta(200, { ok: true, user_id: id, email: endereco, senha_temporaria: senha, mensagem: `Conta criada para ${endereco}.` });
        return resposta(200, { ok: true, user_id: id, mensagem: `Conta criada. A senha temporária foi enviada para ${endereco}.` });
      }

      case "nova_senha": {
        const id = alvo(corpo.user_id);
        const perfil = await perfilDe(id);
        if (!perfil) throw new Recusa("usuário não encontrado no CMS", 404);
        const usuario = await servidor(`/auth/v1/admin/users/${id}`);
        const endereco = usuario.ok ? ((usuario.corpo as Json).email as string) : null;
        if (!endereco) throw new Recusa("usuário não encontrado", 404);
        const senha = senhaAleatoria();
        const r = await servidor(`/auth/v1/admin/users/${id}`, { method: "PUT", body: JSON.stringify({ password: senha }) });
        if (!r.ok) throw new Recusa(`não foi possível trocar a senha (${r.status})`, 502);
        await servidor(`/rest/v1/perfis?user_id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ trocar_senha: true }), headers: { Prefer: "return=minimal" } });
        if (!(await enviarEmail(endereco, await nomeDe(perfil.integrante), senha, true)))
          return resposta(200, { ok: true, email: endereco, senha_temporaria: senha, mensagem: `Nova senha temporária gerada para ${endereco}.` });
        return resposta(200, { ok: true, mensagem: `Nova senha temporária enviada para ${endereco}.` });
      }

      case "zerar_mfa": {
        const id = alvo(corpo.user_id);
        if (!(await perfilDe(id))) throw new Recusa("usuário não encontrado no CMS", 404);
        const fatores = await servidor(`/auth/v1/admin/users/${id}/factors`);
        const lista = fatores.ok && Array.isArray(fatores.corpo) ? (fatores.corpo as unknown as { id: string }[]) : [];
        for (const f of lista) {
          const r = await servidor(`/auth/v1/admin/users/${id}/factors/${f.id}`, { method: "DELETE" });
          if (!r.ok) throw new Recusa(`não foi possível remover a verificação (${r.status})`, 502);
        }
        return resposta(200, { ok: true, mensagem: "Verificação em duas etapas removida. No próximo acesso, a pessoa cadastra de novo." });
      }

      default:
        throw new Recusa("ação desconhecida");
    }
  } catch (e) {
    if (e instanceof Recusa) return resposta(e.status, { erro: e.message });
    console.error(`gerenciar-usuarios: ${e instanceof Error ? e.message : String(e)}`);
    return resposta(500, { erro: "falha interna; tente de novo" });
  }
}

const deno = (globalThis as unknown as { Deno?: { serve(h: (req: Request) => Promise<Response>): void; env: { get(nome: string): string | undefined } } }).Deno;
if (deno) deno.serve((req) => tratar(req, (nome) => deno.env.get(nome)));
