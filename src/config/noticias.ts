/**
 * Fontes de notícias (canais RSS públicos).
 *
 * Cada fonte é uma categoria do site, definida pelo TIPO de conteúdo e pelo LOCAL de referência
 * (o órgão ou veículo de origem). Para adicionar uma fonte, inclua um objeto nesta lista:
 * a página da categoria, o sitemap, as abas da página inicial e os filtros são gerados automaticamente.
 */

export type TipoFonte = "tribunais" | "imprensa";

export type FonteNoticias = {
  /** Usado na URL: /noticias/<id> */
  id: string;
  nome: string;
  /** Local de referência: órgão ou veículo de origem. */
  local: string;
  tipo: TipoFonte;
  /** Rótulo do tipo de conteúdo exibido nos cartões. */
  rotuloTipo: string;
  descricao: string;
  feed: string;
  site: string;
  /** Limite de itens lidos do feed. */
  limite: number;
};

export const tiposFonte: Record<TipoFonte, { nome: string; descricao: string }> = {
  tribunais: { nome: "Tribunais", descricao: "Conteúdo publicado pelos próprios tribunais." },
  imprensa: { nome: "Imprensa jurídica", descricao: "Veículos especializados em notícias do meio jurídico." },
};

export const fontesNoticias: FonteNoticias[] = [
  {
    id: "stj-noticias",
    nome: "STJ Notícias",
    local: "Superior Tribunal de Justiça",
    tipo: "tribunais",
    rotuloTipo: "Notícia institucional",
    descricao: "Notícias oficiais publicadas pela Secretaria de Comunicação do Superior Tribunal de Justiça.",
    feed: "https://res.stj.jus.br/hrestp-c-portalp/RSS.xml",
    site: "https://www.stj.jus.br/sites/portalp/Comunicacao/Ultimas-noticias",
    limite: 40,
  },
  {
    id: "stj-jurisprudencia",
    nome: "STJ Jurisprudência",
    local: "Superior Tribunal de Justiça — Pesquisa Pronta",
    tipo: "tribunais",
    rotuloTipo: "Jurisprudência",
    descricao: "Temas da Pesquisa Pronta: seleção de entendimentos do STJ organizada pela Secretaria de Jurisprudência.",
    feed: "https://scon.stj.jus.br/SCON/PesquisaProntaFeed",
    site: "https://scon.stj.jus.br/SCON/pesquisa_pronta/",
    limite: 30,
  },
  {
    id: "conjur",
    nome: "ConJur",
    local: "Consultor Jurídico",
    tipo: "imprensa",
    rotuloTipo: "Imprensa jurídica",
    descricao: "Notícias e análises publicadas pela revista eletrônica Consultor Jurídico.",
    feed: "https://www.conjur.com.br/feed/",
    site: "https://www.conjur.com.br/",
    limite: 30,
  },
  {
    id: "migalhas",
    nome: "Migalhas",
    local: "Migalhas",
    tipo: "imprensa",
    rotuloTipo: "Imprensa jurídica",
    descricao: "Notícias do informativo jurídico Migalhas.",
    feed: "https://www.migalhas.com.br/rss/rss.xml",
    site: "https://www.migalhas.com.br/",
    limite: 30,
  },
];

export const getFonte = (id: string) => fontesNoticias.find((f) => f.id === id);

export const noticiasHref = (id?: string) => (id ? `/noticias/${id}` : "/noticias");
