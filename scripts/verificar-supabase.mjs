// Confere a conexão com o Supabase usando só a chave pública (o mesmo acesso que o navegador terá).
// Uso: npm run supabase:verificar   (lê .env.local, se existir, e as variáveis do ambiente)
//
// Verifica: variáveis preenchidas e sem segredos, migrations aplicadas, público vendo só artigos
// publicados e sem acesso a campos internos, e cadastro público desligado. Nunca imprime a chave.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const raiz = path.resolve(import.meta.dirname, "..");
const envLocal = path.join(raiz, ".env.local");
if (fs.existsSync(envLocal)) process.loadEnvFile(envLocal);

const { motivoSegredo, variaveisPublicasComSegredo } = await import(pathToFileURL(path.join(raiz, "src/lib/supabase/chaves.ts")).href);

let falhas = 0;
const ok = (msg) => console.log(`  ok    ${msg}`);
const falha = (msg) => { console.log(`  ERRO  ${msg}`); falhas++; };
const aviso = (msg) => console.log(`  aviso ${msg}`);

console.log("Variáveis");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
if (!url || !chave) {
  falha("preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local (veja .env.example)");
  process.exit(1);
}
if (!/^https:\/\/[^/\s]+$/.test(url)) falha("NEXT_PUBLIC_SUPABASE_URL deve ser só o endereço, com https e sem barra no final (ex.: https://abcd.supabase.co)");
else ok("URL no formato esperado");
const motivo = motivoSegredo(chave);
if (motivo) falha(`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contém ${motivo}: troque pela chave publishable/anon`);
else ok("chave pública (não é secreta)");
for (const v of variaveisPublicasComSegredo(process.env)) if (!v.startsWith("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")) falha(`segredo em variável pública: ${v}`);
if (falhas) process.exit(1);

const cabecalhos = { apikey: chave, ...(chave.split(".").length === 3 ? { Authorization: `Bearer ${chave}` } : {}) };
async function pedir(caminho) {
  try {
    const r = await fetch(`${url}${caminho}`, { headers: cabecalhos });
    const texto = await r.text();
    let corpo = null;
    try { corpo = JSON.parse(texto); } catch { corpo = texto; }
    return { status: r.status, corpo };
  } catch (e) {
    return { status: 0, corpo: e.cause?.code ?? e.message };
  }
}

console.log("Banco (acesso público)");
const lista = await pedir("/rest/v1/artigos?select=slug,status&order=slug");
if (lista.status === 0) {
  falha(`não foi possível conectar (${lista.corpo}): confira a URL e a internet`);
} else if (lista.status === 401) {
  falha("chave recusada pelo Supabase: confira NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
} else if (lista.status === 404 || lista.corpo?.code === "PGRST205") {
  falha("tabela public.artigos não encontrada: aplique as migrations de supabase/migrations");
} else if (lista.status !== 200 || !Array.isArray(lista.corpo)) {
  falha(`resposta inesperada (${lista.status}): ${JSON.stringify(lista.corpo).slice(0, 160)}`);
} else {
  const naoPublicados = lista.corpo.filter((a) => a.status !== "publicado");
  if (naoPublicados.length) falha(`o público vê ${naoPublicados.length} artigo(s) não publicado(s): revise as políticas de RLS`);
  else ok(`${lista.corpo.length} artigo(s) publicado(s) visíveis, nenhum rascunho exposto`);
  if (lista.corpo.length === 0) aviso("nenhum artigo publicado: a migration de importação foi aplicada?");

  const interno = await pedir("/rest/v1/artigos?select=criado_por&limit=1");
  if (interno.status === 200) falha("o público consegue ler campos internos (criado_por): revise os privilégios de coluna");
  else ok("campos internos fechados para o público");

  const pedidos = await pedir("/rest/v1/pedidos_atualizacao?select=id&limit=1");
  if (pedidos.status === 200 && Array.isArray(pedidos.corpo) && pedidos.corpo.length > 0) falha("o público consegue ler pedidos de atualização");
  else ok("pedidos de atualização fechados para o público");
}

console.log("Login");
const config = await pedir("/auth/v1/settings");
if (config.status !== 200 || typeof config.corpo !== "object") {
  aviso("não foi possível ler as configurações de login");
} else {
  if (config.corpo.disable_signup === true) ok("cadastro público desligado (contas só por convite)");
  else falha('cadastro público LIGADO: desligue "Allow new users to sign up" em Authentication');
  if (config.corpo.external?.email) ok("login por e-mail ativo");
  else falha("login por e-mail desativado: ative o provedor Email em Authentication");
  if (config.corpo.mailer_autoconfirm) aviso('"Confirm email" está desligado: recomenda-se manter ligado');
}

console.log(falhas ? `\n${falhas} problema(s). Veja supabase/README.md.` : "\nConexão com o Supabase configurada corretamente.");
process.exit(falhas ? 1 : 0);
