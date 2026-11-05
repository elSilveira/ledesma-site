import type { AreaSlug } from "@/config/site";
import artigosCms from "./artigos-cms.json";

/**
 * Artigos informativos.
 *
 * A fonte é o CMS (Supabase): só os artigos publicados lá viram páginas. Antes de cada build,
 * scripts/sincronizar-artigos.mjs baixa e valida esses artigos e grava artigos-cms.json (gerado,
 * fora do Git). Para criar, editar, publicar ou retirar um artigo, use o painel /admin.
 * As páginas, o sitemap, os dados estruturados e os links internos são gerados a partir desta lista.
 */

export type Bloco =
  | { tipo: "p"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "nota"; texto: string };

export type Artigo = {
  slug: string;
  titulo: string;
  /** Meta description: até ~155 caracteres. */
  descricao: string;
  resumo: string;
  area: AreaSlug;
  /** ISO 8601 (AAAA-MM-DD). */
  publicadoEm: string;
  atualizadoEm: string;
  /** Slug de quem revisou e assina o texto, ou a lista de slugs quando mais de um assina. Pendente até a revisão. */
  revisadoPor: string | string[] | null;
  palavrasChave: string[];
  secoes: { titulo: string; blocos: Bloco[] }[];
  referencias: string[];
};

// Validado na sincronização; o JSON não carrega os tipos literais (área, tipo de bloco), por isso a conversão
export const artigos = artigosCms as unknown as Artigo[];

export const getArtigo = (slug: string) => artigos.find((a) => a.slug === slug);

export const artigosPorArea = (area: AreaSlug) => artigos.filter((a) => a.area === area);

export const artigosOrdenados = () => [...artigos].sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm));

export const artigoHref = (slug: string) => `/artigos/${slug}`;

/** Slugs de quem assina o artigo (vazio enquanto não houver revisão). */
export const assinantes = (a: Artigo) => (a.revisadoPor === null ? [] : [a.revisadoPor].flat());

export const tempoDeLeitura = (a: Artigo) => {
  const texto = a.secoes
    .flatMap((s) => [s.titulo, ...s.blocos.flatMap((b) => (b.tipo === "lista" ? b.itens : [b.texto]))])
    .join(" ");
  return Math.max(1, Math.round(texto.split(/\s+/).length / 200));
};

export const formatarData = (iso: string) => {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${dia} de ${meses[mes - 1]} de ${ano}`;
};
