// Gera a migration que importa os artigos de src/content/articles.ts para o CMS (Supabase).
// Uso: node scripts/gerar-importacao-artigos.mjs
//
// Rode antes de aplicar a migration no banco. Depois de aplicada, não gere de novo: migrations já
// executadas não devem mudar. A importação preserva slug (URL), textos, datas, assinantes e metadados,
// marca os artigos como publicados e já no ar (revisão 1) e não gera pedido de atualização do site.
// Já usado: a importação foi aplicada e os artigos agora vêm do CMS (src/content/articles.ts lê o que o CMS publica).
// Mantido só como registro de como a migration 20261105120200 foi gerada.
console.error("Este script já foi usado: os artigos agora vêm do CMS. Não há o que importar.");
process.exit(1);

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const raiz = path.resolve(import.meta.dirname, "..");
const { artigos } = await import(pathToFileURL(path.join(raiz, "src/content/articles.ts")).href);
const destino = path.join(raiz, "supabase/migrations/20261105120200_cms_importacao_artigos.sql");

const linhas = artigos.map((a) => ({
  slug: a.slug,
  titulo: a.titulo,
  descricao: a.descricao,
  resumo: a.resumo,
  area: a.area,
  publicado_em: a.publicadoEm,
  atualizado_em: a.atualizadoEm,
  assinantes: a.revisadoPor === null ? [] : [a.revisadoPor].flat(),
  palavras_chave: a.palavrasChave,
  secoes: a.secoes,
  referencias: a.referencias,
}));

const json = JSON.stringify(linhas, null, 2);
if (json.includes("$artigos$")) throw new Error("O conteúdo contém o delimitador $artigos$; troque o delimitador.");

const sql = `-- Importação dos ${linhas.length} artigos que estavam em src/content/articles.ts.
-- Gerado por scripts/gerar-importacao-artigos.mjs; não edite à mão.
-- Os artigos entram publicados e marcados como já no ar (revisão 1), sem disparar atualização do site.
-- Rodar de novo não duplica: slugs já existentes são ignorados.

select set_config('cms.importacao', 'on', false);

insert into public.artigos (
  slug, titulo, descricao, resumo, area, publicado_em, atualizado_em, assinantes, palavras_chave,
  secoes, referencias, status, revisao_no_ar, no_ar_em, conformidade_confirmada_em
)
select
  x.slug, x.titulo, x.descricao, x.resumo, x.area, x.publicado_em, x.atualizado_em,
  array(select jsonb_array_elements_text(x.assinantes)),
  array(select jsonb_array_elements_text(x.palavras_chave)),
  x.secoes,
  array(select jsonb_array_elements_text(x.referencias)),
  'publicado', 1, now(), now()
from jsonb_to_recordset($artigos$${json}$artigos$::jsonb) as x(
  slug text, titulo text, descricao text, resumo text, area text, publicado_em date, atualizado_em date,
  assinantes jsonb, palavras_chave jsonb, secoes jsonb, referencias jsonb
)
on conflict (slug) do nothing;

select set_config('cms.importacao', 'off', false);
`;

fs.writeFileSync(destino, sql);
console.log(`${linhas.length} artigos -> ${path.relative(raiz, destino)}`);
