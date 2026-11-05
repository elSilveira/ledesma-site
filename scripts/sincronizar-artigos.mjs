// Busca no CMS (Supabase) os artigos publicados e grava src/content/artigos-cms.json, que o site lê no build.
// Uso: npm run sincronizar      (roda sozinho antes de "npm run build" e de "npm run dev")
//
// Segurança e confiabilidade:
// - usa só a chave pública e pede só as colunas públicas; o banco (RLS) já não entrega rascunhos;
// - valida cada artigo antes de gravar; qualquer falha (rede, chave, formato) encerra com erro,
//   o que interrompe o build e o deploy, mantendo no ar a versão anterior do site;
// - o arquivo público não leva campos internos (status, revisão, autor); as revisões publicadas vão para
//   .cms/manifesto.json, fora do site, para a futura confirmação de deploy.
// Com --tolerante (usado no "npm run dev"), uma falha mantém o último arquivo baixado e só avisa.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const raiz = path.resolve(import.meta.dirname, "..");
const destino = path.join(raiz, "src/content/artigos-cms.json");
const manifesto = path.join(raiz, ".cms/manifesto.json");
const tolerante = process.argv.includes("--tolerante");

const envLocal = path.join(raiz, ".env.local");
if (fs.existsSync(envLocal)) process.loadEnvFile(envLocal);

const importar = (arquivo) => import(pathToFileURL(path.join(raiz, arquivo)).href);
const { motivoSegredo } = await importar("src/lib/supabase/chaves.ts");
const { equipe } = await importar("src/config/site.ts");
const { areas } = await importar("src/content/areas.ts");

// Falhas viram exceção e são tratadas no fim, definindo o código de saída sem process.exit():
// encerrar à força com a conexão HTTP ainda aberta derruba o Node no Windows
class Falha extends Error {}
const falhar = (mensagem) => {
  throw new Falha(mensagem);
};

async function sincronizar() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !chave) falhar("defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (veja .env.example).");
  if (!/^https:\/\/[^/\s]+$/.test(url)) falhar("NEXT_PUBLIC_SUPABASE_URL deve ser https e sem barra no final.");
  if (motivoSegredo(chave)) falhar("a chave informada não é a pública (publishable/anon).");

  // Só colunas públicas; "revisao" vai apenas para o manifesto interno
  const colunas = "slug,titulo,descricao,resumo,area,publicado_em,atualizado_em,assinantes,palavras_chave,secoes,referencias,revisao";
  let linhas;
  let erroDeRede = null;
  try {
    const resposta = await fetch(`${url}/rest/v1/artigos?select=${colunas}&status=eq.publicado`, {
      headers: { apikey: chave, ...(chave.split(".").length === 3 ? { Authorization: `Bearer ${chave}` } : {}) },
      signal: AbortSignal.timeout(30_000),
    });
    // Lê a resposta inteira antes de encerrar (encerrar com a conexão aberta derruba o Node no Windows)
    const corpo = await resposta.text();
    if (!resposta.ok) erroDeRede = `o Supabase respondeu ${resposta.status} ${resposta.statusText}.`;
    else linhas = JSON.parse(corpo);
  } catch (e) {
    erroDeRede = e instanceof SyntaxError ? "resposta inválida do Supabase." : `não foi possível conectar ao Supabase (${e.cause?.code ?? e.name}).`;
  }
  if (erroDeRede) falhar(erroDeRede);
  if (!Array.isArray(linhas)) falhar("resposta inesperada do Supabase.");
  // Zero artigos publicados quase sempre indica problema (chave, permissão ou banco errado), não um site vazio
  if (linhas.length === 0) falhar("nenhum artigo publicado veio do CMS; por segurança, o site não é gerado sem artigos.");

  // ---------------------------------------------------------------------------
  // Validação (as mesmas regras do banco, conferidas de novo antes de virar página)
  // ---------------------------------------------------------------------------
  const slugsArea = areas.map((a) => a.slug);
  const slugsEquipe = new Set(equipe.map((p) => p.slug));
  const problemas = [];
  const texto = (onde, v, max) => {
    if (typeof v !== "string" || !v.trim()) return problemas.push(`${onde}: vazio`);
    if (v.length > max) problemas.push(`${onde}: mais de ${max} caracteres`);
    if (/[<>]|[\u0000-\u001f\u007f]|(javascript|vbscript|data|file)\s*:/i.test(v)) problemas.push(`${onde}: conteúdo não permitido`);
  };
  const data = (onde, v) => {
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) problemas.push(`${onde}: data inválida`);
  };

  const vistos = new Set();
  for (const l of linhas) {
    const id = l.slug ?? "(sem endereço)";
    if (typeof l.slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.slug)) problemas.push(`${id}: endereço inválido`);
    if (vistos.has(l.slug)) problemas.push(`${id}: endereço repetido`);
    vistos.add(l.slug);
    texto(`${id}: título`, l.titulo, 160);
    texto(`${id}: descrição`, l.descricao, 200);
    texto(`${id}: resumo`, l.resumo, 300);
    if (!slugsArea.includes(l.area)) problemas.push(`${id}: área desconhecida (${l.area})`);
    data(`${id}: publicado em`, l.publicado_em);
    data(`${id}: atualizado em`, l.atualizado_em);
    if (!Array.isArray(l.assinantes) || l.assinantes.some((s) => !slugsEquipe.has(s))) problemas.push(`${id}: assinante desconhecido`);
    for (const p of l.palavras_chave ?? []) texto(`${id}: palavra-chave`, p, 80);
    for (const r of l.referencias ?? []) texto(`${id}: referência`, r, 300);
    if (!Array.isArray(l.secoes) || l.secoes.length === 0) problemas.push(`${id}: sem conteúdo`);
    for (const [si, s] of (l.secoes ?? []).entries()) {
      texto(`${id}: seção ${si + 1}`, s?.titulo, 160);
      if (!Array.isArray(s?.blocos) || s.blocos.length === 0) problemas.push(`${id}: seção ${si + 1} sem blocos`);
      for (const b of s?.blocos ?? []) {
        if (b?.tipo === "p" || b?.tipo === "nota") texto(`${id}: seção ${si + 1}`, b.texto, 2000);
        else if (b?.tipo === "lista" && Array.isArray(b.itens) && b.itens.length) b.itens.forEach((it) => texto(`${id}: seção ${si + 1}, lista`, it, 1000));
        else problemas.push(`${id}: seção ${si + 1} com bloco inválido`);
      }
    }
  }
  if (problemas.length) falhar(`artigos inválidos:\n  - ${problemas.join("\n  - ")}`);

  // ---------------------------------------------------------------------------
  // Formato do site (tipo Artigo de src/content/articles.ts), só com campos públicos
  // ---------------------------------------------------------------------------
  // Ordem estável: por área (na ordem do site), data de publicação e endereço
  const ordem = (l) => [slugsArea.indexOf(l.area), l.publicado_em, l.slug];
  linhas.sort((a, b) => {
    const [x, y] = [ordem(a), ordem(b)];
    return x[0] - y[0] || x[1].localeCompare(y[1]) || x[2].localeCompare(y[2]);
  });

  const artigos = linhas.map((l) => ({
    slug: l.slug,
    titulo: l.titulo,
    descricao: l.descricao,
    resumo: l.resumo,
    area: l.area,
    publicadoEm: l.publicado_em,
    atualizadoEm: l.atualizado_em,
    // Um assinante: o slug; vários: a lista; nenhum: conteúdo institucional
    revisadoPor: l.assinantes.length === 0 ? null : l.assinantes.length === 1 ? l.assinantes[0] : l.assinantes,
    palavrasChave: l.palavras_chave ?? [],
    secoes: l.secoes.map((s) => ({
      titulo: s.titulo,
      blocos: s.blocos.map((b) => (b.tipo === "lista" ? { tipo: "lista", itens: b.itens } : { tipo: b.tipo, texto: b.texto })),
    })),
    referencias: l.referencias ?? [],
  }));

  fs.writeFileSync(destino, `${JSON.stringify(artigos, null, 2)}\n`);
  fs.mkdirSync(path.dirname(manifesto), { recursive: true });
  fs.writeFileSync(
    manifesto,
    `${JSON.stringify({ geradoEm: new Date().toISOString(), artigos: Object.fromEntries(linhas.map((l) => [l.slug, l.revisao])) }, null, 2)}\n`,
  );
  console.log(`${artigos.length} artigo(s) publicado(s) sincronizado(s) do CMS -> ${path.relative(raiz, destino)}`);
}

try {
  await sincronizar();
} catch (e) {
  if (!(e instanceof Falha)) throw e;
  if (tolerante && fs.existsSync(destino)) {
    console.warn(`Aviso: ${e.message}\nUsando os artigos da última sincronização (${path.relative(raiz, destino)}).`);
  } else {
    console.error(`Erro na sincronização dos artigos: ${e.message}\nO build foi interrompido; nada foi publicado.`);
    process.exitCode = 1;
  }
}
