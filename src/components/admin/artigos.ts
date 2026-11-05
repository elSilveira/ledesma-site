import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { AreaSlug } from "@/config/site";
import type { Artigo } from "@/content/articles";
import type { Perfil } from "./sessao";

/**
 * Artigos no CMS: leitura, validação e gravação. As mesmas regras são aplicadas pelo banco
 * (supabase/migrations); aqui elas só antecipam os erros para quem está escrevendo.
 */

export type Status = "rascunho" | "publicado" | "retirado";

export type LinhaArtigo = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  resumo: string;
  area: AreaSlug;
  publicado_em: string | null;
  atualizado_em: string | null;
  assinantes: string[];
  palavras_chave: string[];
  secoes: Artigo["secoes"];
  referencias: string[];
  imagem_capa: string | null;
  status: Status;
  revisao: number;
  revisao_no_ar: number | null;
  criado_por: string | null;
  modificado_em: string;
};

export const COLUNAS =
  "id, slug, titulo, descricao, resumo, area, publicado_em, atualizado_em, assinantes, palavras_chave, secoes, referencias, imagem_capa, status, revisao, revisao_no_ar, criado_por, modificado_em";

/** Bloco no formulário: a lista é editada como texto, um item por linha. */
export type BlocoForm = { tipo: "p" | "nota" | "lista"; texto: string };
export type SecaoForm = { titulo: string; blocos: BlocoForm[] };

export type Formulario = {
  titulo: string;
  slug: string;
  descricao: string;
  resumo: string;
  area: AreaSlug | "";
  assinantes: string[];
  palavrasChave: string;
  referencias: string;
  secoes: SecaoForm[];
  /** Mantida como veio do banco: o painel não envia imagens. */
  imagemCapa: string | null;
  publicadoEm: string;
};

export const statusCms: Record<Status, string> = { rascunho: "Rascunho", publicado: "Publicado", retirado: "Retirado do site" };

/** Situação no site publicado, separada do status no CMS: só um deploy confirmado muda "no ar". */
export function noSite(a: Pick<LinhaArtigo, "status" | "revisao" | "revisao_no_ar">): { texto: string; tom: "ok" | "pendente" | "neutro" } {
  if (a.status === "publicado") {
    if (a.revisao_no_ar === a.revisao) return { texto: "No ar", tom: "ok" };
    return { texto: a.revisao_no_ar ? "Atualizando no site" : "Entrando no site", tom: "pendente" };
  }
  return a.revisao_no_ar ? { texto: "Saindo do site", tom: "pendente" } : { texto: "Fora do site", tom: "neutro" };
}

export const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function slugificar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/, "");
}

export function formularioVazio(assinantes: string[] = []): Formulario {
  return {
    titulo: "",
    slug: "",
    descricao: "",
    resumo: "",
    area: "",
    assinantes,
    palavrasChave: "",
    referencias: "",
    secoes: [{ titulo: "", blocos: [{ tipo: "p", texto: "" }] }],
    imagemCapa: null,
    publicadoEm: "",
  };
}

export function formularioDe(l: LinhaArtigo): Formulario {
  return {
    titulo: l.titulo,
    slug: l.slug,
    descricao: l.descricao,
    resumo: l.resumo,
    area: l.area,
    assinantes: l.assinantes,
    palavrasChave: l.palavras_chave.join(", "),
    referencias: l.referencias.join("\n"),
    secoes: l.secoes.map((s) => ({
      titulo: s.titulo,
      blocos: s.blocos.map((b) => (b.tipo === "lista" ? { tipo: "lista" as const, texto: b.itens.join("\n") } : { tipo: b.tipo, texto: b.texto })),
    })),
    imagemCapa: l.imagem_capa,
    publicadoEm: l.publicado_em ?? "",
  };
}

/** Descrição para buscadores: a informada ou, em branco, o próprio resumo. */
export const descricaoFinal = (f: Pick<Formulario, "descricao" | "resumo">) => (f.descricao.trim() || f.resumo.trim()).slice(0, 200);

const linhas = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);
const palavras = (t: string) => t.split(",").map((x) => x.trim()).filter(Boolean);

function secoesDe(f: Formulario): Artigo["secoes"] {
  return f.secoes.map((s) => ({
    titulo: s.titulo.trim(),
    blocos: s.blocos.map((b) => (b.tipo === "lista" ? { tipo: "lista" as const, itens: linhas(b.texto) } : { tipo: b.tipo, texto: b.texto.trim() })),
  }));
}

/** Artigo no formato do site, para a pré-visualização. */
export function artigoDe(f: Formulario, atualizadoEm: string | null): Artigo {
  const publicadoEm = f.publicadoEm || hoje();
  return {
    slug: f.slug || "previa",
    titulo: f.titulo.trim() || "(sem título)",
    descricao: descricaoFinal(f),
    resumo: f.resumo.trim(),
    area: f.area || "direito-trabalhista",
    publicadoEm,
    atualizadoEm: atualizadoEm && atualizadoEm > publicadoEm ? atualizadoEm : publicadoEm,
    revisadoPor: f.assinantes.length ? f.assinantes : null,
    palavrasChave: palavras(f.palavrasChave),
    secoes: secoesDe(f)
      .map((s) => ({ ...s, blocos: s.blocos.filter((b) => (b.tipo === "lista" ? b.itens.length > 0 : b.texto)) }))
      .filter((s) => s.titulo || s.blocos.length),
    referencias: linhas(f.referencias),
  };
}

// ---------------------------------------------------------------------------
// Validação (espelha private.texto_seguro e as checagens do banco)
// ---------------------------------------------------------------------------

function problemaTexto(t: string, maximo: number): string | null {
  if (!t.trim()) return "não pode ficar vazio";
  if (t.length > maximo) return `use no máximo ${maximo} caracteres (tem ${t.length})`;
  if (/[<>]/.test(t)) return "não use os sinais < ou >";
  if (/[\u0000-\u001f\u007f]/.test(t)) return "remova quebras de linha ou caracteres especiais";
  if (/(javascript|vbscript|data|file)\s*:/i.test(t)) return "contém um endereço não permitido";
  for (const url of t.match(/[a-z][a-z0-9+.-]*:\/\/\S*/gi) ?? []) {
    if (!/^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d{2,5})?(\/[^\s<>"'`]*)?$/i.test(url.replace(/[.,;:)]+$/, "")))
      return `link não permitido (${url.slice(0, 40)}): use apenas https://`;
  }
  return null;
}

export type ErroCampo = { campo: string; mensagem: string };

export function validar(f: Formulario, publicar: boolean): ErroCampo[] {
  const e: ErroCampo[] = [];
  const texto = (campo: string, valor: string, max: number) => {
    const p = problemaTexto(valor, max);
    if (p) e.push({ campo, mensagem: p });
  };
  texto("Título", f.titulo, 160);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) e.push({ campo: "Título", mensagem: "use letras ou números no título (ele também forma o endereço do artigo)" });
  if (!f.area) e.push({ campo: "Área", mensagem: "escolha a área de atuação" });
  texto("Resumo", f.resumo, 300);
  if (f.descricao.trim()) texto("Descrição para o Google", f.descricao, 200);
  const pc = palavras(f.palavrasChave);
  if (pc.length > 12) e.push({ campo: "Palavras-chave", mensagem: "use até 12" });
  pc.forEach((p) => texto("Palavras-chave", p, 80));
  const refs = linhas(f.referencias);
  if (refs.length > 20) e.push({ campo: "Referências", mensagem: "use até 20" });
  refs.forEach((r) => texto("Referências", r, 300));

  if (f.secoes.length === 0) e.push({ campo: "Texto", mensagem: "inclua pelo menos um subtítulo com texto" });
  if (f.secoes.length > 30) e.push({ campo: "Texto", mensagem: "use até 30 subtítulos" });
  f.secoes.forEach((s, si) => {
    const onde = `Subtítulo ${si + 1}`;
    texto(onde, s.titulo, 160);
    if (s.blocos.length === 0) e.push({ campo: onde, mensagem: "escreva pelo menos um texto abaixo dele" });
    s.blocos.forEach((b, bi) => {
      const campo = `${onde}, ${b.tipo === "lista" ? "lista" : b.tipo === "nota" ? "destaque" : "texto"} ${bi + 1}`;
      if (b.tipo === "lista") {
        const itens = linhas(b.texto);
        if (itens.length === 0) e.push({ campo, mensagem: "a lista precisa de pelo menos um item" });
        if (itens.length > 30) e.push({ campo, mensagem: "use até 30 itens" });
        itens.forEach((it) => texto(campo, it, 1000));
      } else texto(campo, b.texto, 2000);
    });
  });
  if (publicar && f.publicadoEm && !/^\d{4}-\d{2}-\d{2}$/.test(f.publicadoEm)) e.push({ campo: "Data de publicação", mensagem: "data inválida" });

  // Mesma mensagem repetida no mesmo campo (ex.: vários itens) aparece uma vez só
  return e.filter((x, i) => e.findIndex((y) => y.campo === x.campo && y.mensagem === x.mensagem) === i);
}

// ---------------------------------------------------------------------------
// Permissões (as mesmas da RLS; o banco tem a palavra final)
// ---------------------------------------------------------------------------

export function podeEditar(l: Pick<LinhaArtigo, "criado_por" | "assinantes"> | null, perfil: Perfil) {
  if (!l) return true; // artigo novo
  return perfil.papel === "admin" || l.criado_por === perfil.userId || (!!perfil.integrante && l.assinantes.includes(perfil.integrante));
}

/** Mesmas regras do banco: admin exclui qualquer artigo; advogado, só o próprio rascunho que nunca foi ao ar. */
export function podeExcluir(l: Pick<LinhaArtigo, "criado_por" | "status" | "revisao_no_ar">, perfil: Perfil) {
  if (perfil.papel === "admin") return true;
  return l.criado_por === perfil.userId && l.status === "rascunho" && l.revisao_no_ar === null;
}

// ---------------------------------------------------------------------------
// Gravação
// ---------------------------------------------------------------------------

export type Resultado = { linha: LinhaArtigo; erro?: undefined } | { linha?: undefined; erro: string };

function traduzir(e: PostgrestError): string {
  if (e.code === "23505") return "Já existe um artigo com este endereço. Mude o endereço (slug).";
  if (e.code === "42501" || /row-level security/i.test(e.message)) {
    return "Você não tem permissão para esta alteração. Quem não criou o artigo precisa continuar entre os assinantes.";
  }
  // Mensagens do próprio banco (validação) já estão em português
  if (e.code === "P0001") return `O banco recusou: ${e.message}.`;
  return "Não foi possível salvar. Verifique a conexão e tente de novo.";
}

/**
 * Grava o artigo. `confirmouConformidade` registra a revisão quanto à publicidade da OAB, que o banco
 * exige para publicar ou alterar um artigo publicado.
 */
export async function salvar(
  supabase: SupabaseClient,
  { atual, form, status, confirmouConformidade }: { atual: LinhaArtigo | null; form: Formulario; status: Status; confirmouConformidade: boolean },
): Promise<Resultado> {
  const publicando = status === "publicado";
  const publicadoEm = form.publicadoEm || (publicando ? hoje() : null);
  // "Atualizado em" do site acompanha as alterações de conteúdo publicadas
  const atualizadoEm = publicando ? (atual?.status === "publicado" || atual?.revisao_no_ar ? hoje() : publicadoEm) : (atual?.atualizado_em ?? publicadoEm);

  const dados = {
    slug: form.slug,
    titulo: form.titulo.trim(),
    descricao: descricaoFinal(form),
    resumo: form.resumo.trim(),
    area: form.area,
    publicado_em: publicadoEm,
    atualizado_em: atualizadoEm && publicadoEm && atualizadoEm < publicadoEm ? publicadoEm : atualizadoEm,
    assinantes: form.assinantes,
    palavras_chave: palavras(form.palavrasChave),
    secoes: secoesDe(form),
    referencias: linhas(form.referencias),
    imagem_capa: form.imagemCapa,
    status,
    ...(confirmouConformidade ? { conformidade_confirmada_em: new Date().toISOString() } : {}),
  };

  if (!atual) {
    const { data, error } = await supabase.from("artigos").insert(dados).select(COLUNAS).single();
    return error ? { erro: traduzir(error) } : { linha: data as LinhaArtigo };
  }
  // Só grava se ninguém salvou outra versão desde que o artigo foi aberto
  const { data, error } = await supabase.from("artigos").update(dados).eq("id", atual.id).eq("revisao", atual.revisao).select(COLUNAS);
  if (error) return { erro: traduzir(error) };
  if (!data?.length) return { erro: "O artigo foi alterado por outra pessoa enquanto você editava, ou você não tem permissão. Recarregue antes de salvar." };
  return { linha: data[0] as LinhaArtigo };
}

export async function excluir(supabase: SupabaseClient, id: string): Promise<string | null> {
  const { data, error } = await supabase.from("artigos").delete().eq("id", id).select("id");
  if (error) return traduzir(error);
  return data?.length ? null : "Não foi possível excluir: você só pode excluir os seus rascunhos que nunca foram ao ar.";
}
