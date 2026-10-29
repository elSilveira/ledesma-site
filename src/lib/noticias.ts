import { cacheLife } from "next/cache";
import type { AreaSlug } from "@/config/site";
import { type FonteNoticias, fontesNoticias } from "@/config/noticias";
import type { Noticia, Tribunal } from "./noticias-shared";

export type { Noticia, Tribunal };

/**
 * Leitura dos canais RSS das fontes de notícias.
 *
 * Exibimos apenas manchete, resumo curto, data e link para a matéria original:
 * o conteúdo completo permanece no site de cada veículo.
 * Os feeds são lidos no servidor e mantidos em cache; uma fonte fora do ar é simplesmente omitida.
 */

export type ResultadoFonte = { fonte: string; ok: boolean; total: number };

export type Noticias = { itens: Noticia[]; fontes: ResultadoFonte[]; atualizadoEm: string };

const USER_AGENT = "LedesmaAdvocaciaSite/1.0 (leitor de RSS; +https://ledesma.adv.br)";
const TAMANHO_RESUMO = 220;

/** Todas as notícias, da mais recente para a mais antiga. Atualiza a cada 30 minutos. */
export async function getNoticias(): Promise<Noticias> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 1800, expire: 86400 });

  const resultados = await Promise.all(fontesNoticias.map(lerFonte));
  const vistos = new Set<string>();
  const itens = resultados
    .flatMap((r) => r.itens)
    .filter((n) => (vistos.has(n.link) ? false : (vistos.add(n.link), true)))
    .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));

  return {
    itens,
    fontes: resultados.map((r) => ({ fonte: r.fonte, ok: r.ok, total: r.itens.length })),
    atualizadoEm: new Date().toISOString(),
  };
}

async function lerFonte(fonte: FonteNoticias): Promise<{ fonte: string; ok: boolean; itens: Noticia[] }> {
  try {
    const res = await fetch(fonte.feed, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = (await res.text()).replace(/^﻿/, "");
    if (!/<(rss|feed|rdf:RDF)\b/i.test(xml.slice(0, 2000))) throw new Error("resposta não é um feed");
    const itens = parseFeed(xml, fonte).slice(0, fonte.limite);
    return { fonte: fonte.id, ok: itens.length > 0, itens };
  } catch (e) {
    console.warn(`[noticias] fonte "${fonte.id}" indisponível: ${e instanceof Error ? e.message : e}`);
    return { fonte: fonte.id, ok: false, itens: [] };
  }
}

/* ------------------------------------------------------------------ */
/* Parser RSS 2.0 / Atom                                               */
/* ------------------------------------------------------------------ */

export function parseFeed(xml: string, fonte: Pick<FonteNoticias, "id">): Noticia[] {
  const blocos = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? [];
  const out: Noticia[] = [];
  for (const b of blocos) {
    const titulo = limparTexto(campo(b, "title") ?? "");
    const link = linkDoItem(b);
    if (!titulo || !link) continue;

    const descricao = limparTexto(campo(b, "description") ?? campo(b, "summary") ?? "");
    const conteudo = limparTexto(campo(b, "content:encoded") ?? campo(b, "content") ?? "");
    // Alguns feeds repetem o título na descrição: nesse caso usamos o início do conteúdo
    const base = descricao && normalizar(descricao) !== normalizar(titulo) ? descricao : conteudo;
    const resumo = encurtar(base, TAMANHO_RESUMO);

    const categorias = [
      ...[...b.matchAll(/<category(?:\s[^>]*[^/>])?>([\s\S]*?)<\/category>/gi)].map((m) => m[1]),
      ...[...b.matchAll(/<category\s[^>]*\bterm="([^"]*)"[^>]*\/>/gi)].map((m) => m[1]),
    ]
      .map(limparTexto)
      .filter(Boolean);

    const texto = `${titulo} ${resumo} ${categorias.join(" ")}`;
    const tribunais = detectarTribunais(`${titulo} ${resumo}`);
    if (fonte.id.startsWith("stj") && !tribunais.includes("STJ")) tribunais.unshift("STJ");

    const dataBruta = campo(b, "pubDate") ?? campo(b, "published") ?? campo(b, "updated") ?? campo(b, "dc:date");
    out.push({
      id: `${fonte.id}:${campo(b, "guid") ?? campo(b, "id") ?? link}`,
      fonte: fonte.id,
      titulo,
      resumo,
      link,
      data: dataBruta ? parseData(limparTexto(dataBruta)) : null,
      autor: limparTexto(campo(b, "dc:creator") ?? campo(b, "author") ?? "") || null,
      areas: classificarAreas(texto),
      tribunais,
      regional: REGIONAL.test(semAcento(texto)) || /\b(TJPR|TJMS|TRF-?[34]|TRT-?(9|24))\b/.test(texto),
    });
  }
  return out;
}

function campo(xml: string, nome: string): string | null {
  const n = nome.replace(":", "\\:");
  const m = xml.match(new RegExp(`<${n}\\b[^>]*>([\\s\\S]*?)</${n}>`, "i"));
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : null;
}

function linkDoItem(b: string): string | null {
  const rss = campo(b, "link");
  const atom = b.match(/<link\b[^>]*?href="([^"]+)"[^>]*?(?:rel="alternate")?[^>]*\/?>/i)?.[1];
  const candidato = decodificar((rss || atom || campo(b, "guid") || "").trim());
  try {
    const u = new URL(candidato);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Texto                                                               */
/* ------------------------------------------------------------------ */

const ENTIDADES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", ndash: "–", mdash: "—",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»", ordm: "º", ordf: "ª", sect: "§", deg: "°",
  aacute: "á", Aacute: "Á", agrave: "à", Agrave: "À", acirc: "â", Acirc: "Â", atilde: "ã", Atilde: "Ã",
  eacute: "é", Eacute: "É", ecirc: "ê", Ecirc: "Ê", iacute: "í", Iacute: "Í", oacute: "ó", Oacute: "Ó",
  ocirc: "ô", Ocirc: "Ô", otilde: "õ", Otilde: "Õ", uacute: "ú", Uacute: "Ú", uuml: "ü", ccedil: "ç", Ccedil: "Ç",
};

function decodificar(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const cp = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp < 0x110000 ? String.fromCodePoint(cp) : "";
    }
    return ENTIDADES[e] ?? m;
  });
}

function limparTexto(html: string): string {
  return decodificar(
    html
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<(script|style|figure|figcaption)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/<[^>]+>/g, " ") // tags que vieram codificadas como entidades
    .replace(/O post [\s\S]{0,300}? apareceu primeiro em [\s\S]{0,80}?\.\s*$/, "")
    .replace(/\[(…|\.\.\.)\]/g, "")
    .replace(/[​-‍﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function encurtar(s: string, max: number): string {
  if (s.length <= max) return s;
  const corte = s.slice(0, max);
  return `${corte.slice(0, Math.max(corte.lastIndexOf(" "), max - 30)).replace(/[\s,.;:–—-]+$/, "")}…`;
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const normalizar = (s: string) => semAcento(s).replace(/[^a-z0-9]+/g, " ").trim();

/* ------------------------------------------------------------------ */
/* Datas                                                               */
/* ------------------------------------------------------------------ */

const MESES: Record<string, string> = {
  jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06", jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12",
};

/** Aceita RFC 822/ISO e o formato em português do STJ ("Qui, out 29 2026 13:58:00", horário de Brasília). */
export function parseData(s: string): string | null {
  const pt = semAcento(s).match(/\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (pt) {
    const [, mes, dia, ano, h = "12", min = "00", seg = "00"] = pt;
    const d = new Date(`${ano}-${MESES[mes]}-${dia.padStart(2, "0")}T${h.padStart(2, "0")}:${min}:${seg}-03:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/* ------------------------------------------------------------------ */
/* Classificação                                                       */
/* ------------------------------------------------------------------ */

// Termos comparados sem acento e em minúsculas, a partir do início da palavra
const TERMOS: Record<AreaSlug, RegExp> = {
  "direito-criminal-e-penal":
    /\b(penal|penais|crim|prisao|prisoes|preso|presa|presos|presas|presidi|habeas corpus|trafic|homicid|juri\b|inquerito|denuncia\b|denunciad|reu\b|reus\b|flagrante|custodia\b|execucao penal|maria da penha|violencia domestica|estupr|roubo|furto|latrocin|feminicid|lavagem de dinheiro|faccao|faccoes|delacao|colaboracao premiada|prisao preventiva|stm\b|delit|policia|policial)/,
  "direito-trabalhista":
    /\b(trabalhist|trabalhador|trabalho\b|tst\b|trt|empregad|emprego\b|clt\b|fgts|justa causa|horas? extras?|jornada de trabalho|sindica|vinculo empregaticio|aviso previo|reclamacao trabalhista|assedio moral|terceirizac|reforma trabalhista)/,
  "direito-previdenciario":
    /\b(inss|previdenc|previdenciari|aposentad|bpc\b|loas\b|pensao por morte|auxilio[- ]doenca|auxilio por incapacidade|salario[- ]maternidade|beneficio assistencial|rgps\b|seguridade social|incapacidade permanente)/,
};

function classificarAreas(texto: string): AreaSlug[] {
  const t = semAcento(texto);
  return (Object.keys(TERMOS) as AreaSlug[]).filter((a) => TERMOS[a].test(t));
}

const REGIONAL = /\b(parana|paranaense|mato grosso do sul|sul-mato-grossense|toledo|iguatemi|cascavel|curitiba|campo grande)\b/;

function detectarTribunais(texto: string): Tribunal[] {
  const achados: Tribunal[] = [];
  for (const m of texto.matchAll(/\b(STF|STJ|TST|TSE|CNJ|TRF|TRT|TJ|TRE)(?:-?\d{1,2}|-?[A-Z]{2}|DFT)?\b/g)) {
    const t = m[1] as Tribunal;
    if (!achados.includes(t)) achados.push(t);
  }
  if (/Supremo Tribunal Federal/i.test(texto) && !achados.includes("STF")) achados.push("STF");
  if (/Superior Tribunal de Justiça/i.test(texto) && !achados.includes("STJ")) achados.push("STJ");
  if (/Tribunal Superior do Trabalho/i.test(texto) && !achados.includes("TST")) achados.push("TST");
  return achados;
}
