// Edge Function "cms-mcp": servidor MCP (Claude, Codex) para criar, editar, publicar e retirar artigos do site.
//
// Autenticação: OAuth 2.1 do próprio Supabase Auth. Sem token válido, responde 401 com o endereço dos metadados
// (RFC 9728), e o cliente MCP faz o login pela tela /admin/autorizar do painel. O token é da própria pessoa:
// todas as leituras e gravações passam pela RLS do banco, exatamente como no painel. Nada de chave service_role aqui.
//
// Publicar com a verificação de JWT desligada (--no-verify-jwt): a descoberta do OAuth precisa responder sem token;
// o token é conferido abaixo, no Supabase Auth, antes de qualquer ferramenta.
//
// Excluir artigos não é possível por aqui: só pelo painel.
//
// Arquivo único e sem dependências, como as outras funções do projeto.

type Ambiente = (nome: string) => string | undefined;
type Json = Record<string, unknown>;

const VERSOES = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const SITE_PADRAO = "https://ledesma.adv.br";

const AREAS: Record<string, string> = {
  "direito-criminal-e-penal": "Direito Criminal",
  "direito-trabalhista": "Direito Trabalhista",
  "direito-previdenciario": "Direito Previdenciário",
  "direito-de-familia-e-sucessoes": "Direito de Família e Sucessões",
};

const COLUNAS =
  "id,slug,titulo,descricao,resumo,area,publicado_em,atualizado_em,assinantes,palavras_chave,secoes,referencias,status,revisao,revisao_no_ar,criado_por,modificado_em";

const GUIA = `Guia editorial dos artigos da Ledesma Advocacia

Publicidade da advocacia (Código de Ética da OAB e Provimento 205/2021). O texto é informativo, nunca captação de clientela:
- Não prometa resultado, ganho de causa, prazo ou valor ("garantimos", "você vai receber", "em X dias").
- Não use linguagem de medo, urgência ou sensacionalismo ("não perca", "corra", "você pode ser preso se...").
- Não se apresente como especialista, nem cite especializações, títulos, casos ou números que não foram informados.
- Não compare o escritório com outros, não fale de preços, honorários ou gratuidade, não ofereça consulta.
- Não invente leis, artigos, súmulas, prazos ou dados. Cite a fonte em "referencias" quando usar uma norma.
- Use linguagem sóbria, clara e em português do Brasil; explique termos técnicos.
- Pode encerrar recomendando procurar orientação de um advogado para o caso concreto, sem chamar para o escritório.

Formato:
- titulo (até 160 caracteres), resumo (até 300, aparece na lista), descricao opcional para o Google (até 200; em branco usa o resumo).
- area: uma das áreas de "areas_e_assinantes". assinantes: slugs dos advogados que revisaram/assinam.
- secoes: lista de { titulo, blocos }, com blocos { "tipo": "p", "texto" } (parágrafo), { "tipo": "nota", "texto" } (destaque)
  ou { "tipo": "lista", "itens": [ ... ] }. Até 30 seções; textos até 2000 caracteres; itens até 1000.
- Sem HTML e sem os sinais < >. Links só com https://. palavras_chave até 12; referencias até 20 (até 300 caracteres cada).

Fluxo:
1. Crie sempre como rascunho (criar_rascunho) e mostre o texto completo para a pessoa.
2. Só use publicar_artigo depois que a pessoa ler e disser, nesta conversa, que revisou o texto quanto às regras da OAB.
   Nunca marque confirmo_revisao_oab por conta própria.
3. A publicação atualiza o site em alguns minutos; use situacao_do_site para acompanhar.`;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const hoje = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

function slugificar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/, "");
}

class ErroFerramenta extends Error {}

function problemaTexto(t: unknown, maximo: number): string | null {
  if (typeof t !== "string" || !t.trim()) return "não pode ficar vazio";
  if (t.length > maximo) return `use no máximo ${maximo} caracteres (tem ${t.length})`;
  if (/[<>]/.test(t)) return "não use os sinais < ou >";
  if (/[\u0000-\u001f\u007f]/.test(t)) return "remova quebras de linha ou caracteres de controle";
  if (/(javascript|vbscript|data|file)\s*:/i.test(t)) return "contém um endereço não permitido";
  for (const url of t.match(/[a-z][a-z0-9+.-]*:\/\/\S*/gi) ?? []) {
    if (!/^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d{2,5})?(\/[^\s<>"'`]*)?$/i.test(url.replace(/[.,;:)]+$/, "")))
      return `link não permitido (${url.slice(0, 40)}): use apenas https://`;
  }
  return null;
}

type Bloco = { tipo: "p" | "nota"; texto: string } | { tipo: "lista"; itens: string[] };
type Secao = { titulo: string; blocos: Bloco[] };

/** Confere os campos enviados (os que vierem). O banco repete as mesmas regras e tem a palavra final. */
function validarCampos(c: Json): string[] {
  const e: string[] = [];
  const texto = (nome: string, v: unknown, max: number) => {
    const p = problemaTexto(v, max);
    if (p) e.push(`${nome}: ${p}`);
  };
  if ("titulo" in c) texto("titulo", c.titulo, 160);
  if ("slug" in c && (typeof c.slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.slug) || c.slug.length > 120))
    e.push("slug: use letras minúsculas, números e hífens");
  if ("area" in c && !(typeof c.area === "string" && c.area in AREAS)) e.push(`area: use uma de ${Object.keys(AREAS).join(", ")}`);
  if ("resumo" in c) texto("resumo", c.resumo, 300);
  if ("descricao" in c && c.descricao) texto("descricao", c.descricao, 200);
  const lista = (nome: string, v: unknown, maxItens: number, maxTexto: number) => {
    if (!Array.isArray(v)) return e.push(`${nome}: envie uma lista`);
    if (v.length > maxItens) e.push(`${nome}: use até ${maxItens}`);
    v.forEach((x, i) => texto(`${nome}[${i + 1}]`, x, maxTexto));
  };
  if ("palavras_chave" in c) lista("palavras_chave", c.palavras_chave, 12, 80);
  if ("referencias" in c) lista("referencias", c.referencias, 20, 300);
  if ("assinantes" in c && !(Array.isArray(c.assinantes) && c.assinantes.every((a) => typeof a === "string")))
    e.push("assinantes: envie uma lista de slugs de advogados");
  if ("secoes" in c) {
    const s = c.secoes;
    if (!Array.isArray(s) || s.length === 0) e.push("secoes: inclua pelo menos uma seção");
    else {
      if (s.length > 30) e.push("secoes: use até 30");
      s.forEach((secao: Secao, i: number) => {
        const onde = `secoes[${i + 1}]`;
        if (!secao || typeof secao !== "object") return e.push(`${onde}: formato inválido`);
        texto(`${onde}.titulo`, secao.titulo, 160);
        if (!Array.isArray(secao.blocos) || secao.blocos.length === 0) return e.push(`${onde}.blocos: inclua pelo menos um bloco`);
        secao.blocos.forEach((b: Bloco, j: number) => {
          const ob = `${onde}.blocos[${j + 1}]`;
          if (b?.tipo === "lista") {
            if (!Array.isArray(b.itens) || b.itens.length === 0) return e.push(`${ob}: a lista precisa de itens`);
            if (b.itens.length > 30) e.push(`${ob}: use até 30 itens`);
            b.itens.forEach((it, k) => texto(`${ob}.itens[${k + 1}]`, it, 1000));
          } else if (b?.tipo === "p" || b?.tipo === "nota") texto(ob, b.texto, 2000);
          else e.push(`${ob}: tipo deve ser "p", "nota" ou "lista"`);
        });
      });
    }
  }
  return e;
}

/** Só os campos de conteúdo, limpos (sem espaços nas pontas). */
function conteudo(c: Json): Json {
  const d: Json = {};
  for (const k of ["titulo", "slug", "resumo", "area"]) if (typeof c[k] === "string") d[k] = (c[k] as string).trim();
  if ("descricao" in c) d.descricao = typeof c.descricao === "string" ? c.descricao.trim() : "";
  for (const k of ["palavras_chave", "referencias", "assinantes"])
    if (Array.isArray(c[k])) d[k] = (c[k] as string[]).map((x) => x.trim()).filter(Boolean);
  if (Array.isArray(c.secoes))
    d.secoes = (c.secoes as Secao[]).map((s) => ({
      titulo: s.titulo.trim(),
      blocos: s.blocos.map((b) => (b.tipo === "lista" ? { tipo: "lista", itens: b.itens.map((x) => x.trim()).filter(Boolean) } : { tipo: b.tipo, texto: b.texto.trim() })),
    }));
  return d;
}

// ---------------------------------------------------------------------------
// Banco (sempre com o token da própria pessoa: a RLS decide o que pode)
// ---------------------------------------------------------------------------

type Banco = (caminho: string, init?: RequestInit & { prefer?: string }) => Promise<unknown>;

function traduzirErroBanco(status: number, corpo: { code?: string; message?: string }): string {
  if (corpo.code === "23505") return "Já existe um artigo com este endereço (slug). Use outro slug.";
  if (corpo.code === "42501" || /row-level security/i.test(corpo.message ?? ""))
    return "Sem permissão para esta alteração. Quem não criou o artigo precisa estar entre os assinantes.";
  if (corpo.code === "P0001" || corpo.code === "23514") return `O banco recusou: ${corpo.message}.`;
  if (status === 401) return "Sessão expirada. Reconecte o servidor MCP.";
  return `Não foi possível concluir (erro ${status}${corpo.code ? ` ${corpo.code}` : ""}).`;
}

function criarBanco(env: Ambiente, buscar: typeof fetch, token: string): Banco {
  const url = env("SUPABASE_URL")!;
  const chave = env("SUPABASE_ANON_KEY") ?? env("SUPABASE_PUBLISHABLE_KEY") ?? "";
  return async (caminho, init = {}) => {
    const { prefer, ...resto } = init;
    const r = await buscar(`${url}/rest/v1/${caminho}`, {
      ...resto,
      headers: {
        apikey: chave,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
      },
    });
    const texto = await r.text();
    const corpo = texto ? JSON.parse(texto) : null;
    if (!r.ok) throw new ErroFerramenta(traduzirErroBanco(r.status, corpo ?? {}));
    return corpo;
  };
}

type Linha = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  resumo: string;
  status: "rascunho" | "publicado" | "retirado";
  revisao: number;
  revisao_no_ar: number | null;
  publicado_em: string | null;
  atualizado_em: string | null;
  secoes: Secao[];
  [k: string]: unknown;
};

function noSite(a: Pick<Linha, "status" | "revisao" | "revisao_no_ar">) {
  if (a.status === "publicado") return a.revisao_no_ar === a.revisao ? "no ar" : a.revisao_no_ar ? "atualizando no site" : "entrando no site";
  return a.revisao_no_ar ? "saindo do site" : "fora do site";
}

const ehUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

async function buscarArtigo(banco: Banco, ref: unknown): Promise<Linha> {
  if (typeof ref !== "string" || !ref.trim()) throw new ErroFerramenta("Informe o artigo (id ou slug).");
  const filtro = ehUuid(ref) ? `id=eq.${ref}` : `slug=eq.${encodeURIComponent(ref.trim())}`;
  const linhas = (await banco(`artigos?select=${COLUNAS}&${filtro}`)) as Linha[];
  if (!linhas.length) throw new ErroFerramenta("Artigo não encontrado (ou sem permissão para vê-lo).");
  return linhas[0];
}

/** Grava só se ninguém alterou o artigo desde a revisão informada. */
async function atualizar(banco: Banco, atual: Linha, revisao: unknown, dados: Json): Promise<Linha> {
  const rev = typeof revisao === "number" ? revisao : atual.revisao;
  const r = (await banco(`artigos?id=eq.${atual.id}&revisao=eq.${rev}&select=${COLUNAS}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
    prefer: "return=representation",
  })) as Linha[];
  if (!r.length)
    throw new ErroFerramenta(
      `O artigo mudou desde a revisão ${rev} (agora está na ${atual.revisao}) ou você não tem permissão. Leia de novo com ler_artigo antes de alterar.`,
    );
  return r[0];
}

function resumoLinha(a: Linha, site: string) {
  return {
    id: a.id,
    slug: a.slug,
    titulo: a.titulo,
    area: a.area,
    status: a.status,
    no_site: noSite(a),
    revisao: a.revisao,
    modificado_em: a.modificado_em,
    endereco: a.status === "publicado" ? `${site}/artigos/${a.slug}/` : null,
  };
}

// ---------------------------------------------------------------------------
// Ferramentas
// ---------------------------------------------------------------------------

const textoProp = (description: string) => ({ type: "string", description });
const listaTexto = (description: string) => ({ type: "array", items: { type: "string" }, description });
const ARTIGO_REF = textoProp("id (uuid) ou slug do artigo");
const REVISAO = { type: "integer", description: "revisão lida em ler_artigo (protege contra sobrescrever a edição de outra pessoa)" };
const SECOES = {
  type: "array",
  description: "seções do texto",
  items: {
    type: "object",
    required: ["titulo", "blocos"],
    properties: {
      titulo: { type: "string" },
      blocos: {
        type: "array",
        items: {
          type: "object",
          required: ["tipo"],
          properties: {
            tipo: { type: "string", enum: ["p", "nota", "lista"] },
            texto: { type: "string", description: "para p e nota" },
            itens: { type: "array", items: { type: "string" }, description: "para lista" },
          },
        },
      },
    },
  },
};
const CAMPOS = {
  titulo: textoProp("título (até 160 caracteres)"),
  slug: textoProp("endereço do artigo; em branco, gerado do título"),
  area: { type: "string", enum: Object.keys(AREAS) },
  resumo: textoProp("resumo (até 300 caracteres)"),
  descricao: textoProp("descrição para o Google (opcional, até 200)"),
  assinantes: listaTexto("slugs dos advogados que assinam (veja areas_e_assinantes)"),
  palavras_chave: listaTexto("até 12"),
  referencias: listaTexto("fontes citadas, até 20"),
  secoes: SECOES,
};
const CONFIRMACAO = {
  type: "boolean",
  description:
    "true SOMENTE se a pessoa disse nesta conversa que leu o texto final e revisou quanto às regras de publicidade da OAB. Nunca preencha por conta própria.",
};

const leitura = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

const FERRAMENTAS = [
  { name: "guia_editorial", description: "Regras da OAB e formato dos artigos. Leia antes de escrever.", inputSchema: { type: "object", properties: {} }, annotations: leitura },
  { name: "areas_e_assinantes", description: "Áreas de atuação válidas e advogados que podem assinar, e o seu papel no CMS.", inputSchema: { type: "object", properties: {} }, annotations: leitura },
  {
    name: "listar_artigos",
    description: "Lista os artigos do CMS com status e situação no site.",
    inputSchema: {
      type: "object",
      properties: { status: { type: "string", enum: ["rascunho", "publicado", "retirado"] }, busca: textoProp("trecho do título") },
    },
    annotations: leitura,
  },
  { name: "ler_artigo", description: "Mostra um artigo completo, com a revisão atual.", inputSchema: { type: "object", required: ["artigo"], properties: { artigo: ARTIGO_REF } }, annotations: leitura },
  {
    name: "criar_rascunho",
    description: "Cria um artigo como rascunho (não vai para o site). Siga o guia_editorial.",
    inputSchema: { type: "object", required: ["titulo", "area", "resumo", "secoes"], properties: CAMPOS },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: "editar_artigo",
    description:
      "Altera campos de um artigo (só os enviados). Se o artigo estiver publicado, a alteração vai para o site e exige confirmo_revisao_oab.",
    inputSchema: {
      type: "object",
      required: ["artigo", "revisao"],
      properties: { artigo: ARTIGO_REF, revisao: REVISAO, ...CAMPOS, confirmo_revisao_oab: CONFIRMACAO },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: "publicar_artigo",
    description: "Publica o artigo no site. Só depois que a pessoa revisou o texto final e confirmou nesta conversa.",
    inputSchema: { type: "object", required: ["artigo", "revisao", "confirmo_revisao_oab"], properties: { artigo: ARTIGO_REF, revisao: REVISAO, confirmo_revisao_oab: CONFIRMACAO } },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "retirar_artigo",
    description: "Tira um artigo publicado do site (continua guardado no CMS e pode voltar a ser publicado).",
    inputSchema: { type: "object", required: ["artigo", "revisao"], properties: { artigo: ARTIGO_REF, revisao: REVISAO } },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
  },
  { name: "situacao_do_site", description: "Mostra se há alterações esperando o site e como terminou a última atualização.", inputSchema: { type: "object", properties: {} }, annotations: leitura },
];

async function executar(nome: string, a: Json, banco: Banco, usuario: { id: string; email?: string }, site: string): Promise<unknown> {
  switch (nome) {
    case "guia_editorial":
      return GUIA;

    case "areas_e_assinantes": {
      const [integrantes, perfis] = (await Promise.all([
        banco("integrantes?select=slug,nome&ativo=eq.true&order=nome"),
        banco(`perfis?select=papel,integrante,ativo&user_id=eq.${usuario.id}`),
      ])) as [Json[], Json[]];
      return {
        areas: Object.entries(AREAS).map(([slug, nome]) => ({ slug, nome })),
        assinantes: integrantes,
        voce: perfis[0] ? { email: usuario.email, ...perfis[0] } : { email: usuario.email, aviso: "sem perfil ativo no CMS" },
      };
    }

    case "listar_artigos": {
      let filtro = "";
      if (typeof a.status === "string" && ["rascunho", "publicado", "retirado"].includes(a.status)) filtro += `&status=eq.${a.status}`;
      if (typeof a.busca === "string" && a.busca.trim()) filtro += `&titulo=ilike.${encodeURIComponent(`*${a.busca.trim().replace(/[*,()]/g, " ")}*`)}`;
      const linhas = (await banco(`artigos?select=${COLUNAS}${filtro}&order=modificado_em.desc&limit=100`)) as Linha[];
      if (!linhas.length) return "Nenhum artigo encontrado. Se você é admin e esperava ver artigos, autorize o aplicativo de novo (o acesso de admin vale 30 dias).";
      return linhas.map((l) => resumoLinha(l, site));
    }

    case "ler_artigo": {
      const l = await buscarArtigo(banco, a.artigo);
      return { ...l, no_site: noSite(l), endereco: l.status === "publicado" ? `${site}/artigos/${l.slug}/` : null };
    }

    case "criar_rascunho": {
      const campos: Json = { ...a, slug: typeof a.slug === "string" && a.slug.trim() ? a.slug.trim() : slugificar(String(a.titulo ?? "")) };
      for (const k of ["titulo", "area", "resumo", "secoes"]) if (!(k in campos)) throw new ErroFerramenta(`Falta o campo ${k}.`);
      const erros = validarCampos(campos);
      if (erros.length) throw new ErroFerramenta(`Corrija antes de salvar:\n- ${erros.join("\n- ")}`);
      const d = conteudo(campos);
      if (!d.descricao) d.descricao = String(d.resumo).slice(0, 200);
      if (!("assinantes" in d)) {
        const perfis = (await banco(`perfis?select=integrante&user_id=eq.${usuario.id}`)) as { integrante: string | null }[];
        d.assinantes = perfis[0]?.integrante ? [perfis[0].integrante] : [];
      }
      const r = (await banco(`artigos?select=${COLUNAS}`, { method: "POST", body: JSON.stringify({ ...d, status: "rascunho" }), prefer: "return=representation" })) as Linha[];
      return { criado: resumoLinha(r[0], site), aviso: "Rascunho salvo; não está no site. Mostre o texto para a pessoa revisar antes de publicar." };
    }

    case "editar_artigo": {
      const atual = await buscarArtigo(banco, a.artigo);
      const campos: Json = {};
      for (const k of Object.keys(CAMPOS)) if (k in a && a[k] !== undefined) campos[k] = a[k];
      if (!Object.keys(campos).length) throw new ErroFerramenta("Nenhum campo para alterar.");
      const erros = validarCampos(campos);
      if (erros.length) throw new ErroFerramenta(`Corrija antes de salvar:\n- ${erros.join("\n- ")}`);
      const d = conteudo(campos);
      if ("descricao" in d && !d.descricao) d.descricao = String(d.resumo ?? atual.resumo).slice(0, 200);
      if (atual.status === "publicado") {
        if (a.confirmo_revisao_oab !== true)
          throw new ErroFerramenta(
            "Este artigo está publicado: a alteração vai direto para o site. Mostre o texto final à pessoa e só repita com confirmo_revisao_oab = true se ela confirmar a revisão quanto às regras da OAB.",
          );
        d.atualizado_em = hoje();
        d.conformidade_confirmada_em = new Date().toISOString();
      }
      const r = await atualizar(banco, atual, a.revisao, d);
      return { alterado: resumoLinha(r, site), aviso: r.status === "publicado" ? "A alteração entra no site em alguns minutos." : "Rascunho atualizado; não está no site." };
    }

    case "publicar_artigo": {
      if (a.confirmo_revisao_oab !== true)
        throw new ErroFerramenta("Para publicar, a pessoa precisa confirmar nesta conversa que revisou o texto final quanto às regras de publicidade da OAB.");
      const atual = await buscarArtigo(banco, a.artigo);
      if (atual.status === "publicado") return { aviso: "O artigo já está publicado.", artigo: resumoLinha(atual, site) };
      const erros = validarCampos({ titulo: atual.titulo, slug: atual.slug, area: atual.area, resumo: atual.resumo, secoes: atual.secoes });
      if (erros.length) throw new ErroFerramenta(`O artigo ainda não pode ser publicado:\n- ${erros.join("\n- ")}`);
      const publicadoEm = atual.publicado_em ?? hoje();
      const atualizadoEm = atual.revisao_no_ar ? hoje() : publicadoEm;
      const r = await atualizar(banco, atual, a.revisao, {
        status: "publicado",
        publicado_em: publicadoEm,
        atualizado_em: atualizadoEm < publicadoEm ? publicadoEm : atualizadoEm,
        descricao: atual.descricao?.trim() || atual.resumo.slice(0, 200),
        conformidade_confirmada_em: new Date().toISOString(),
      });
      return { publicado: resumoLinha(r, site), aviso: "Publicado no CMS. O site é atualizado sozinho em alguns minutos; acompanhe com situacao_do_site." };
    }

    case "retirar_artigo": {
      const atual = await buscarArtigo(banco, a.artigo);
      if (atual.status !== "publicado") return { aviso: "O artigo não está publicado.", artigo: resumoLinha(atual, site) };
      const r = await atualizar(banco, atual, a.revisao, { status: "retirado" });
      return { retirado: resumoLinha(r, site), aviso: "O artigo sai do site na próxima atualização (alguns minutos). Ele continua guardado no CMS." };
    }

    case "situacao_do_site": {
      const [pendentes, ultimo, concluido] = (await Promise.all([
        banco("pedidos_atualizacao?select=slug,motivo,criado_em&situacao=in.(pendente,disparado)&order=criado_em&limit=50"),
        banco("deploys?select=situacao,disparado_em,concluido_em,detalhes&order=id.desc&limit=1"),
        banco("deploys?select=concluido_em&situacao=eq.concluido&order=concluido_em.desc&limit=1"),
      ])) as [Json[], Json[], Json[]];
      return {
        alteracoes_esperando_o_site: pendentes,
        ultima_atualizacao: ultimo[0] ?? null,
        ultima_concluida_em: concluido[0]?.concluido_em ?? null,
        site: site,
      };
    }
  }
  throw new ErroFerramenta(`Ferramenta desconhecida: ${nome}`);
}

// ---------------------------------------------------------------------------
// HTTP + JSON-RPC (MCP Streamable HTTP, sem sessão)
// ---------------------------------------------------------------------------

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version, mcp-session-id, last-event-id",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "www-authenticate, mcp-session-id",
};
const json = (status: number, corpo: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, "Content-Type": "application/json", ...extra } });

export async function tratar(req: Request, env: Ambiente, buscar: typeof fetch = fetch): Promise<Response> {
  const base = env("SUPABASE_URL");
  if (!base) return json(500, { erro: "SUPABASE_URL ausente" });
  const recurso = `${base}/functions/v1/cms-mcp`;
  const metadados = `${recurso}/.well-known/oauth-protected-resource`;
  const site = (env("SITE_URL") ?? SITE_PADRAO).replace(/\/+$/, "");
  const caminho = new URL(req.url).pathname;

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  // Metadados do recurso protegido (RFC 9728): onde fazer o login
  if (caminho.endsWith("/.well-known/oauth-protected-resource") && req.method === "GET") {
    return json(200, {
      resource: recurso,
      authorization_servers: [`${base}/auth/v1`],
      bearer_methods_supported: ["header"],
      resource_name: "Artigos da Ledesma Advocacia",
    });
  }

  const negar = (descricao?: string) =>
    json(401, { error: "invalid_token", error_description: descricao ?? "Faça login para usar este servidor." }, {
      "WWW-Authenticate": `Bearer resource_metadata="${metadados}"${descricao ? `, error="invalid_token"` : ""}`,
    });

  const token = req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return negar();
  const chave = env("SUPABASE_ANON_KEY") ?? env("SUPABASE_PUBLISHABLE_KEY") ?? "";
  const quem = await buscar(`${base}/auth/v1/user`, { headers: { apikey: chave, Authorization: `Bearer ${token}` } });
  if (!quem.ok) return negar("Token inválido ou expirado.");
  const usuario = (await quem.json()) as { id: string; email?: string };

  if (req.method === "GET") return new Response(null, { status: 405, headers: { ...CORS, Allow: "POST" } });
  if (req.method === "DELETE") return new Response(null, { status: 405, headers: { ...CORS, Allow: "POST" } });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: CORS });

  let entrada: unknown;
  try {
    entrada = await req.json();
  } catch {
    return json(400, { jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } });
  }

  const banco = criarBanco(env, buscar, token);
  const mensagens = Array.isArray(entrada) ? entrada : [entrada];
  const respostas: unknown[] = [];
  for (const m of mensagens as { jsonrpc?: string; id?: string | number; method?: string; params?: Json }[]) {
    const r = await responder(m, banco, usuario, site);
    if (r) respostas.push(r);
  }
  if (!respostas.length) return new Response(null, { status: 202, headers: CORS });
  return json(200, Array.isArray(entrada) ? respostas : respostas[0]);
}

async function responder(
  m: { jsonrpc?: string; id?: string | number; method?: string; params?: Json },
  banco: Banco,
  usuario: { id: string; email?: string },
  site: string,
) {
  if (!m || typeof m !== "object" || typeof m.method !== "string") {
    return m && "id" in m ? { jsonrpc: "2.0", id: m.id ?? null, error: { code: -32600, message: "Requisição inválida" } } : null;
  }
  const notificacao = !("id" in m);
  if (notificacao) return null;
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id: m.id, result });

  switch (m.method) {
    case "initialize": {
      const pedida = String(m.params?.protocolVersion ?? "");
      return ok({
        protocolVersion: VERSOES.includes(pedida) ? pedida : VERSOES[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "ledesma-artigos", title: "Artigos da Ledesma Advocacia", version: "1.0.0" },
        instructions: GUIA,
      });
    }
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: FERRAMENTAS });
    case "tools/call": {
      const nome = String(m.params?.name ?? "");
      if (!FERRAMENTAS.some((f) => f.name === nome)) return { jsonrpc: "2.0", id: m.id, error: { code: -32602, message: `Ferramenta desconhecida: ${nome}` } };
      const args = (m.params?.arguments && typeof m.params.arguments === "object" ? m.params.arguments : {}) as Json;
      try {
        const r = await executar(nome, args, banco, usuario, site);
        return ok({ content: [{ type: "text", text: typeof r === "string" ? r : JSON.stringify(r, null, 2) }] });
      } catch (e) {
        const texto = e instanceof ErroFerramenta ? e.message : "Falha interna ao executar a ferramenta. Tente de novo.";
        if (!(e instanceof ErroFerramenta)) console.error(`cms-mcp ${nome}: ${e instanceof Error ? e.message : String(e)}`);
        return ok({ content: [{ type: "text", text: texto }], isError: true });
      }
    }
    default:
      return { jsonrpc: "2.0", id: m.id, error: { code: -32601, message: `Método não suportado: ${m.method}` } };
  }
}

const deno = (globalThis as unknown as { Deno?: { serve(h: (req: Request) => Promise<Response>): void; env: { get(nome: string): string | undefined } } }).Deno;
if (deno) deno.serve((req) => tratar(req, (nome) => deno.env.get(nome)));
